import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = "https://gsviltgahkigiyepvwie.supabase.co";
let serviceKey = "";

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.split("=")[1].trim();
    }
    if (trimmed.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) {
      serviceKey = trimmed.split("=")[1].trim();
    }
  }
}

if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  {
    email: "admin@demo.com",
    password: "AdminPassword123!",
    fullName: "System Administrator",
    role: "admin",
  },
  {
    email: "staff@demo.com",
    password: "StaffPassword123!",
    fullName: "Operations Staff",
    role: "staff",
  },
  {
    email: "customer@demo.com",
    password: "CustomerPassword123!",
    fullName: "Acme Customer Corp",
    role: "customer",
  },
];

async function seedUsers() {
  console.log("Seeding demo accounts to:", supabaseUrl);

  for (const user of DEMO_USERS) {
    console.log(`\nProvisioning ${user.role}: ${user.email}...`);

    // 1. Create or fetch user in auth.users with pre-confirmed email (no emails sent)
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
        },
      });

    let userId = createData?.user?.id;

    if (createError) {
      if (createError.message.includes("already registered")) {
        console.log(`User ${user.email} already exists, updating role/password...`);
        // Find user ID
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find((u) => u.email === user.email);
        if (existing) {
          userId = existing.id;
          // Update password and confirm email
          await supabase.auth.admin.updateUserById(userId, {
            password: user.password,
            email_confirm: true,
          });
        }
      } else {
        console.error(`Failed to create ${user.email}:`, createError.message);
        continue;
      }
    }

    if (!userId) {
      console.error(`Could not determine user ID for ${user.email}`);
      continue;
    }

    // 2. Set role in profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: user.role,
        full_name: user.fullName,
        is_active: true,
      })
      .eq("id", userId);

    if (profileError) {
      console.error(`Failed to set profile role for ${user.email}:`, profileError.message);
    } else {
      console.log(`Successfully configured ${user.email} as [${user.role}]`);
    }
  }

  console.log("\n========================================================");
  console.log("DEMO ACCOUNTS READY (Pre-confirmed - No emails needed):");
  console.log("1. Admin:    admin@demo.com    / AdminPassword123!");
  console.log("2. Staff:    staff@demo.com    / StaffPassword123!");
  console.log("3. Customer: customer@demo.com / CustomerPassword123!");
  console.log("========================================================\n");
}

seedUsers();
