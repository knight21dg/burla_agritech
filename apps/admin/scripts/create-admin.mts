/**
 * Creates a staff account from the command line.
 *
 *   npm run admin:create --workspace=@burla/admin -- --email you@example.com --name "Your Name" --role admin
 *
 * This exists because there is no sign-up route on the admin and there never
 * will be: the first account has to come from somewhere, and somewhere is a
 * shell on a machine that already has the database credentials.
 *
 * The password is read from the terminal with the echo turned off. It is
 * never passed as an argument (arguments are visible in `ps` and land in
 * shell history), never printed, and never written to a log — only its scrypt
 * hash reaches the database.
 */
import { createInterface } from "node:readline";
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

const ROLES = ["admin", "staff", "content_manager", "order_manager"] as const;
type Role = (typeof ROLES)[number];

/**
 * Everything after a flag until the next one, joined.
 *
 * npm strips the quotes on the way through `npm run … -- --name "A B"`, so a
 * two-word name arrives as two arguments. Taking only the first would create
 * an account called "Burla" and never say why.
 */
function arg(name: string): string | undefined {
  const argv = process.argv;
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return undefined;

  const parts: string[] = [];
  for (let index_ = index + 1; index_ < argv.length; index_ += 1) {
    const value = argv[index_];
    if (value === undefined || value.startsWith("--")) break;
    parts.push(value);
  }
  return parts.length > 0 ? parts.join(" ") : undefined;
}

/** Everything piped in, split into lines, read once and handed out in order. */
async function pipedLines(): Promise<string[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
}

/**
 * Asks for a password without echoing it.
 *
 * With a terminal, the echo is suppressed so nothing appears on screen or in
 * a scrollback. Piped input (a test, CI) has no terminal and nothing to hide,
 * and is read in one go — the alternative is a script that hangs with no
 * output and no explanation.
 */
function makeAsker(piped: string[] | undefined) {
  let next = 0;

  return function ask(prompt: string): Promise<string> {
    if (piped) {
      const value = piped[next];
      next += 1;
      if (value === undefined) {
        return Promise.reject(new Error("Not enough input on standard input."));
      }
      return Promise.resolve(value);
    }

    return new Promise<string>((resolve, reject) => {
      const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });

      let silence = false;
      const write = (rl as unknown as { _writeToOutput: (s: string) => void })
        ._writeToOutput;
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput =
        function patched(this: unknown, chunk: string) {
          if (!silence) write.call(this, chunk);
        };

      rl.question(prompt, (answer) => {
        rl.close();
        process.stdout.write("\n");
        resolve(answer);
      });
      silence = true;
      rl.on("error", reject);
    });
  };
}

async function main(): Promise<void> {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();
  const role = (arg("role") ?? "admin") as Role;

  if (!email || !name) {
    throw new Error(
      'Usage: npm run admin:create -- --email you@example.com --name "Your Name" [--role admin|staff]',
    );
  }
  if (!ROLES.includes(role)) {
    throw new Error(`--role must be one of: ${ROLES.join(", ")}`);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    throw new Error("That does not look like an email address.");
  }

  // Imported after dotenv: the environment is parsed at import time.
  const { hashPassword } = await import("@burla/core/auth");
  const { createStaffUser, emailExists } = await import(
    "@burla/core/repositories/users"
  );

  if (await emailExists(email)) {
    throw new Error(
      `${email} already has an account. Grant it a role from the admin instead of creating a second one.`,
    );
  }

  const ask = makeAsker(process.stdin.isTTY ? undefined : await pipedLines());
  const password = await ask(`Password for ${email}: `);
  const again = await ask("Repeat it: ");

  if (password !== again) throw new Error("The two passwords do not match.");
  if (password.length < 12) {
    // Longer than the customer minimum on purpose: this account can change
    // prices and read every customer's address.
    throw new Error("Use at least 12 characters for a staff password.");
  }

  const user = await createStaffUser({
    email,
    name,
    passwordHash: await hashPassword(password),
    roles: [role],
  });

  if (!user) {
    throw new Error("That email was taken while this ran. Nothing was created.");
  }

  console.log(`\nCreated ${user.email} (${name}) with the ${role} role.`);
  console.log("Sign in at the admin application. The password was not logged.");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
