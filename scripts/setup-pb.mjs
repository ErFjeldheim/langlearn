// One-time setup for the LangLearn Pocketbase instance.
// Run: PB_URL=... PB_ADMIN_EMAIL=... PB_ADMIN_PASSWORD=... npm run setup:pb
// Creates the `vocabulary`, `conversations`, and `progress` collections with
// owner-scoped API rules, and optionally creates the single user account.
import PocketBase from "pocketbase";

const PB_URL = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL;
const ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;
const USER_EMAIL = process.env.LL_USER_EMAIL;
const USER_PASSWORD = process.env.LL_USER_PASSWORD;

if (!PB_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Missing env. Set PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD (and optionally LL_USER_EMAIL, LL_USER_PASSWORD)."
  );
  process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const ownerRule = "@request.auth.id != '' && owner = @request.auth.id";

const collections = [
  {
    name: "vocabulary",
    type: "base",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: ownerRule,
    deleteRule: ownerRule,
    fields: [
      { name: "owner", type: "relation", required: true, cascadeDelete: true, collectionId: "_pb_users_auth_" },
      { name: "term", type: "text", required: true, options: { max: 120 } },
      { name: "translation", type: "text", required: true, options: { max: 200 } },
      { name: "example", type: "text", required: false, options: { max: 400 } },
      { name: "source_lesson", type: "text", required: false, options: { max: 60 } },
      { name: "srs_interval", type: "number", required: false },
      { name: "srs_ease", type: "number", required: false },
      { name: "srs_reps", type: "number", required: false },
      { name: "srs_due", type: "date", required: false },
    ],
  },
  {
    name: "conversations",
    type: "base",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: ownerRule,
    deleteRule: ownerRule,
    fields: [
      { name: "owner", type: "relation", required: true, cascadeDelete: true, collectionId: "_pb_users_auth_" },
      { name: "lesson_id", type: "text", required: true, options: { max: 60 } },
      { name: "role", type: "text", required: true, options: { max: 20 } },
      { name: "content", type: "text", required: true, options: { max: 8000 } },
    ],
  },
  {
    name: "progress",
    type: "base",
    listRule: ownerRule,
    viewRule: ownerRule,
    createRule: "@request.auth.id != '' && owner = @request.auth.id",
    updateRule: ownerRule,
    deleteRule: ownerRule,
    fields: [
      { name: "owner", type: "relation", required: true, cascadeDelete: true, collectionId: "_pb_users_auth_" },
      { name: "lesson_id", type: "text", required: true, options: { max: 60 } },
      { name: "completed", type: "bool", required: false },
      { name: "xp", type: "number", required: false },
      { name: "last_practiced", type: "date", required: false },
    ],
  },
];

async function resolveUsersCollectionId() {
  // Users collection id is conventionally "_pb_users_auth_" but resolve dynamically.
  try {
    const cols = await pb.collections.getFullList();
    const users = cols.find((c) => c.name === "users");
    return users?.id || "_pb_users_auth_";
  } catch {
    return "_pb_users_auth_";
  }
}

async function upsertCollection(def, usersId) {
  // Inject the resolved users collection id into owner relations.
  for (const f of def.fields) {
    if (f.name === "owner" && f.type === "relation") {
      f.collectionId = usersId;
    }
  }
  try {
    const existing = await pb.collections.getOne(def.name);
    await pb.collections.update(existing.id, def);
    console.log(`updated collection: ${def.name}`);
  } catch {
    await pb.collections.create(def);
    console.log(`created collection: ${def.name}`);
  }
}

async function ensureUser() {
  if (!USER_EMAIL || !USER_PASSWORD) {
    console.log("Skipping user creation (LL_USER_EMAIL / LL_USER_PASSWORD not set).");
    return;
  }
  try {
    await pb.collection("users").authWithPassword(USER_EMAIL, USER_PASSWORD);
    console.log(`user already exists: ${USER_EMAIL}`);
  } catch {
    try {
      await pb.collection("users").create({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        passwordConfirm: USER_PASSWORD,
        name: "Erik",
      });
      console.log(`created user: ${USER_EMAIL}`);
    } catch (err) {
      console.error("user create failed:", err?.message || err);
    }
  }
}

async function main() {
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log(`admin auth OK @ ${PB_URL}`);
  const usersId = await resolveUsersCollectionId();
  for (const def of collections) {
    await upsertCollection(def, usersId);
  }
  await ensureUser();
  console.log("Setup complete.");
}

main().catch((e) => {
  console.error("Setup failed:", e?.message || e);
  process.exit(1);
});
