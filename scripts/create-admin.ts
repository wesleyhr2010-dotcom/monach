import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/prisma";
import * as dotenv from "dotenv";

// Load both .env and .env.local
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

async function main() {
    const email = "admin@monarca.com";
    const password = "password123";
    const name = "Administrador Geral";

    console.log(`Creating/updating admin user: ${email}...`);

    // 1. Create or get user in Supabase Auth
    let authUserId: string;

    const { data: existingUserParams } = await supabase.auth.admin.listUsers();
    const existingUser = existingUserParams?.users.find((u) => u.email === email);

    if (existingUser) {
        console.log(`User ${email} already exists in Supabase Auth. Updating password...`);
        authUserId = existingUser.id;
        await supabase.auth.admin.updateUserById(authUserId, { password });
    } else {
        console.log(`Creating user ${email} in Supabase Auth...`);
        const { data: newUser, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (error) {
            console.error("Error creating user:", error);
            process.exit(1);
        }

        authUserId = newUser.user.id;
    }

    // 2. Create or update Reseller in Prisma
    console.log(`Linking Auth User (${authUserId}) to Prisma database as ADMIN...`);

    const admin = await prisma.reseller.upsert({
        where: {
            auth_user_id: authUserId
        },
        update: {
            role: "ADMIN",
            name: name,
            taxa_comissao: 0,
            is_active: true
        },
        create: {
            auth_user_id: authUserId,
            name: name,
            email: email,
            role: "ADMIN",
            whatsapp: "000000000",
            slug: "admin",
            taxa_comissao: 0,
            is_active: true
        }
    });

    console.log("✅ Admin user setup successfully!");
    console.log("-----------------------------------------");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("-----------------------------------------");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
