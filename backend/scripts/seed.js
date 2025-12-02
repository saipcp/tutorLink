import pool from "../config/database.js";
import { hashPassword } from "../utils/password.js";
import { v4 as uuidv4 } from "uuid";

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create admin user
    const adminId = uuidv4();
    const adminPassword = await hashPassword("password");
    await pool.execute(
      `INSERT INTO users (id, firstName, lastName, email, password, role)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id=id`,
      [adminId, "Admin", "User", "admin@tutorlink.com", adminPassword, "admin"]
    );
    console.log("✅ Created admin user");

    // Create sample subjects
    const subjects = [
      { id: uuidv4(), name: "Mathematics" },
      { id: uuidv4(), name: "Physics" },
      { id: uuidv4(), name: "Chemistry" },
      { id: uuidv4(), name: "Biology" },
      { id: uuidv4(), name: "Computer Science" },
      { id: uuidv4(), name: "English" },
      { id: uuidv4(), name: "History" },
    ];

    for (const subject of subjects) {
      await pool.execute(
        "INSERT INTO subjects (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=name",
        [subject.id, subject.name]
      );

      // Add topics for each subject
      const topics = {
        Mathematics: [
          "Basic Algebra",
          "Geometry",
          "Calculus",
          "Statistics",
          "Trigonometry",
        ],
        Physics: [
          "Mechanics",
          "Thermodynamics",
          "Electricity",
          "Quantum Physics",
          "Optics",
        ],
        Chemistry: [
          "Atomic Structure",
          "Chemical Bonds",
          "Organic Chemistry",
          "Biochemistry",
          "Physical Chemistry",
        ],
        Biology: [
          "Cell Biology",
          "Genetics",
          "Ecology",
          "Human Anatomy",
          "Microbiology",
        ],
        "Computer Science": [
          "Programming Basics",
          "Data Structures",
          "Algorithms",
          "Web Development",
          "Database Design",
        ],
        English: [
          "Grammar",
          "Literature",
          "Writing",
          "Reading Comprehension",
          "Vocabulary",
        ],
        History: [
          "World History",
          "American History",
          "European History",
          "Ancient History",
          "Modern History",
        ],
      };

      const subjectTopics = topics[subject.name] || [];
      for (const topicName of subjectTopics) {
        await pool.execute(
          "INSERT INTO topics (id, subjectId, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name",
          [uuidv4(), subject.id, topicName]
        );
      }
    }
    console.log("✅ Created subjects and topics");

    // Create sample tutor
    const tutorUserId = uuidv4();
    const tutorPassword = await hashPassword("password");
    await pool.execute(
      `INSERT INTO users (id, firstName, lastName, email, password, role)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id=id`,
      [
        tutorUserId,
        "John",
        "Tutor",
        "tutor@tutorlink.com",
        tutorPassword,
        "tutor",
      ]
    );

    const tutorProfileId = uuidv4();
    await pool.execute(
      `INSERT INTO tutor_profiles (id, userId, bio, rating, hourlyRate, experience)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id=id`,
      [
        tutorProfileId,
        tutorUserId,
        "Experienced tutor with 5+ years of teaching Mathematics and Physics.",
        4.5,
        30.0,
        5,
      ]
    );

    // Add tutor subjects
    const mathSubject = subjects.find((s) => s.name === "Mathematics");
    const physicsSubject = subjects.find((s) => s.name === "Physics");
    if (mathSubject) {
      await pool.execute(
        "INSERT INTO tutor_subjects (tutorId, subjectId) VALUES (?, ?) ON DUPLICATE KEY UPDATE tutorId=tutorId",
        [tutorProfileId, mathSubject.id]
      );
    }
    if (physicsSubject) {
      await pool.execute(
        "INSERT INTO tutor_subjects (tutorId, subjectId) VALUES (?, ?) ON DUPLICATE KEY UPDATE tutorId=tutorId",
        [tutorProfileId, physicsSubject.id]
      );
    }

    // Add tutor languages
    await pool.execute(
      "INSERT INTO tutor_languages (tutorId, language) VALUES (?, ?) ON DUPLICATE KEY UPDATE tutorId=tutorId",
      [tutorProfileId, "English"]
    );

    console.log("✅ Created sample tutor");

    // Create sample student
    const studentUserId = uuidv4();
    const studentPassword = await hashPassword("password");
    await pool.execute(
      `INSERT INTO users (id, firstName, lastName, email, password, role)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id=id`,
      [
        studentUserId,
        "Jane",
        "Student",
        "student@tutorlink.com",
        studentPassword,
        "student",
      ]
    );

    const studentProfileId = uuidv4();
    await pool.execute(
      `INSERT INTO student_profiles (id, userId, grade, school, preferences)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE id=id`,
      [
        studentProfileId,
        studentUserId,
        "12th Grade",
        "High School",
        JSON.stringify({
          subjects: ["Mathematics", "Physics"],
          learningStyle: ["visual", "hands-on"],
          goals: ["Improve grades", "Prepare for exams"],
        }),
      ]
    );
    console.log("✅ Created sample student");

    // Create sample payment methods for users
    // Admin payment methods
    const adminCardId = uuidv4();
    await pool.execute(
      `INSERT INTO payment_methods (
        id, userId, type, details, expiry, isDefault,
        accountNumber, accountHolderName, bankName, routingNumber, accountType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        adminCardId,
        adminId,
        "card",
        "•••• •••• •••• 4242",
        "12/26",
        true,
        null,
        null,
        null,
        null,
        null,
      ]
    );

    const adminAchId = uuidv4();
    await pool.execute(
      `INSERT INTO payment_methods (
        id, userId, type, details, expiry, isDefault,
        accountNumber, accountHolderName, bankName, routingNumber, accountType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        adminAchId,
        adminId,
        "ach",
        "Chase Bank - ••••7890",
        null,
        false,
        "1234567890",
        "Admin User",
        "Chase Bank",
        "021000021",
        "checking",
      ]
    );
    console.log("✅ Created payment methods for admin");

    // Tutor payment methods
    const tutorCardId = uuidv4();
    await pool.execute(
      `INSERT INTO payment_methods (
        id, userId, type, details, expiry, isDefault,
        accountNumber, accountHolderName, bankName, routingNumber, accountType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        tutorCardId,
        tutorUserId,
        "card",
        "•••• •••• •••• 5555",
        "06/27",
        true,
        null,
        null,
        null,
        null,
        null,
      ]
    );

    const tutorBankId = uuidv4();
    await pool.execute(
      `INSERT INTO payment_methods (
        id, userId, type, details, expiry, isDefault,
        accountNumber, accountHolderName, bankName, routingNumber, accountType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        tutorBankId,
        tutorUserId,
        "bank",
        "Bank of America - ••••4567",
        null,
        false,
        "9876543210",
        "John Tutor",
        "Bank of America",
        "121000248",
        "savings",
      ]
    );

    const tutorPayPalId = uuidv4();
    await pool.execute(
      `INSERT INTO payment_methods (
        id, userId, type, details, expiry, isDefault,
        accountNumber, accountHolderName, bankName, routingNumber, accountType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        tutorPayPalId,
        tutorUserId,
        "paypal",
        "tutor@tutorlink.com",
        null,
        false,
        null,
        null,
        null,
        null,
        null,
      ]
    );
    console.log("✅ Created payment methods for tutor");

    // Student payment methods
    const studentCardId = uuidv4();
    await pool.execute(
      `INSERT INTO payment_methods (
        id, userId, type, details, expiry, isDefault,
        accountNumber, accountHolderName, bankName, routingNumber, accountType
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        studentCardId,
        studentUserId,
        "card",
        "•••• •••• •••• 8888",
        "09/28",
        true,
        null,
        null,
        null,
        null,
        null,
      ]
    );

    const studentWireId = uuidv4();
    await pool.execute(
      `INSERT INTO payment_methods (
        id, userId, type, details, expiry, isDefault,
        accountNumber, accountHolderName, bankName, routingNumber, accountType, swiftCode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        studentWireId,
        studentUserId,
        "wire",
        "Wells Fargo - ••••2468",
        null,
        false,
        "2468135790",
        "Jane Student",
        "Wells Fargo",
        "121042882",
        "checking",
        "WFBIUS6S",
      ]
    );
    console.log("✅ Created payment methods for student");

    // Insert default settings for AI and Security so admin pages have sensible defaults
    const defaultAI = {
      aitutorEnabled: true,
      planGeneratorEnabled: true,
      matchingEnabled: true,
      model: "gpt-4",
    };

    const defaultSecurity = {
      requireEmailVerification: true,
      sessionTimeoutMinutes: 60,
      passwordComplexity: "moderate",
      enable2FA: false,
    };

    await pool.execute(
      "INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
      ["ai", JSON.stringify(defaultAI)]
    );

    await pool.execute(
      "INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)",
      ["security", JSON.stringify(defaultSecurity)]
    );

    console.log("✅ Inserted default settings for AI and Security");

    // Create sample transactions/payments
    // First, create a sample session for transactions
    // Reuse mathSubject and physicsSubject already declared above
    
    if (mathSubject && tutorProfileId && studentUserId) {
      // Get math topics
      const [mathTopics] = await pool.execute(
        "SELECT id FROM topics WHERE subjectId = ? LIMIT 1",
        [mathSubject.id]
      );
      const mathTopicId = mathTopics.length > 0 ? mathTopics[0].id : null;

      // Create sample sessions
      const session1Id = uuidv4();
      const session1Start = new Date("2025-01-15T10:00:00");
      const session1End = new Date("2025-01-15T11:00:00");
      await pool.execute(
        `INSERT INTO sessions (id, tutorId, studentId, subjectId, topicId, startAt, endAt, status, price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          session1Id,
          tutorProfileId,
          studentUserId,
          mathSubject.id,
          mathTopicId,
          session1Start,
          session1End,
          "completed",
          50.0,
        ]
      );

      // Create payment for session 1
      const payment1Id = uuidv4();
      await pool.execute(
        `INSERT INTO payments (id, sessionId, payerId, paymentMethodId, amount, currency, method, status, paidAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          payment1Id,
          session1Id,
          studentUserId,
          studentCardId,
          50.0,
          "USD",
          "card",
          "completed",
          session1Start,
        ]
      );

      const session2Id = uuidv4();
      const session2Start = new Date("2025-01-12T14:00:00");
      const session2End = new Date("2025-01-12T15:00:00");
      await pool.execute(
        `INSERT INTO sessions (id, tutorId, studentId, subjectId, topicId, startAt, endAt, status, price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          session2Id,
          tutorProfileId,
          studentUserId,
          mathSubject.id,
          mathTopicId,
          session2Start,
          session2End,
          "completed",
          50.0,
        ]
      );

      // Create payment for session 2
      const payment2Id = uuidv4();
      await pool.execute(
        `INSERT INTO payments (id, sessionId, payerId, paymentMethodId, amount, currency, method, status, paidAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          payment2Id,
          session2Id,
          studentUserId,
          studentCardId,
          50.0,
          "USD",
          "card",
          "completed",
          session2Start,
        ]
      );

      if (physicsSubject) {
        const [physicsTopics] = await pool.execute(
          "SELECT id FROM topics WHERE subjectId = ? LIMIT 1",
          [physicsSubject.id]
        );
        const physicsTopicId = physicsTopics.length > 0 ? physicsTopics[0].id : null;

        const session3Id = uuidv4();
        const session3Start = new Date("2025-01-10T16:00:00");
        const session3End = new Date("2025-01-10T17:00:00");
        await pool.execute(
          `INSERT INTO sessions (id, tutorId, studentId, subjectId, topicId, startAt, endAt, status, price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE id=id`,
          [
            session3Id,
            tutorProfileId,
            studentUserId,
            physicsSubject.id,
            physicsTopicId,
            session3Start,
            session3End,
            "booked",
            75.0,
          ]
        );

        // Create pending payment for session 3
        const payment3Id = uuidv4();
        await pool.execute(
          `INSERT INTO payments (id, sessionId, payerId, paymentMethodId, amount, currency, method, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE id=id`,
          [
            payment3Id,
            session3Id,
            studentUserId,
            studentCardId,
            75.0,
            "USD",
            "card",
            "pending",
          ]
        );
      }

      // Create a transaction for admin user
      const adminSessionId = uuidv4();
      const adminSessionStart = new Date("2025-01-08T10:00:00");
      const adminSessionEnd = new Date("2025-01-08T11:00:00");
      await pool.execute(
        `INSERT INTO sessions (id, tutorId, studentId, subjectId, topicId, startAt, endAt, status, price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          adminSessionId,
          tutorProfileId,
          adminId,
          mathSubject.id,
          mathTopicId,
          adminSessionStart,
          adminSessionEnd,
          "completed",
          30.0,
        ]
      );

      const adminPaymentId = uuidv4();
      await pool.execute(
        `INSERT INTO payments (id, sessionId, payerId, paymentMethodId, amount, currency, method, status, paidAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [
          adminPaymentId,
          adminSessionId,
          adminId,
          adminCardId,
          30.0,
          "USD",
          "card",
          "completed",
          adminSessionStart,
        ]
      );
    }

    console.log("✅ Created sample transactions");

    // Create sample billing settings
    const adminBillingId = uuidv4();
    await pool.execute(
      `INSERT INTO billing_settings (
        id, userId, billingName, billingEmail, billingAddress,
        monthlyInvoices, autoPayment
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        adminBillingId,
        adminId,
        "Admin User",
        "admin@tutorlink.com",
        "123 Admin Street, New York, NY 10001",
        true,
        true,
      ]
    );

    const tutorBillingId = uuidv4();
    await pool.execute(
      `INSERT INTO billing_settings (
        id, userId, billingName, billingEmail, billingAddress,
        monthlyInvoices, autoPayment
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        tutorBillingId,
        tutorUserId,
        "John Tutor",
        "tutor@tutorlink.com",
        "456 Tutor Avenue, Los Angeles, CA 90001",
        true,
        false,
      ]
    );

    const studentBillingId = uuidv4();
    await pool.execute(
      `INSERT INTO billing_settings (
        id, userId, billingName, billingEmail, billingAddress,
        monthlyInvoices, autoPayment
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        studentBillingId,
        studentUserId,
        "Jane Student",
        "student@tutorlink.com",
        "789 Student Lane, Chicago, IL 60601",
        false,
        true,
      ]
    );

    console.log("✅ Created sample billing settings");

    // Create sample user settings (notifications & privacy)
    const adminUserSettingsId = uuidv4();
    await pool.execute(
      `INSERT INTO user_settings (
        id, userId,
        emailNotifications, pushNotifications, sessionReminders, newMessages, weeklyReports,
        profileVisibility, showOnlineStatus, allowMessages, dataSharing
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        adminUserSettingsId,
        adminId,
        true,
        true,
        true,
        true,
        true,
        "public",
        true,
        true,
        false,
      ]
    );

    const tutorUserSettingsId = uuidv4();
    await pool.execute(
      `INSERT INTO user_settings (
        id, userId,
        emailNotifications, pushNotifications, sessionReminders, newMessages, weeklyReports,
        profileVisibility, showOnlineStatus, allowMessages, dataSharing
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        tutorUserSettingsId,
        tutorUserId,
        true,
        true,
        true,
        true,
        false,
        "public",
        true,
        true,
        false,
      ]
    );

    const studentUserSettingsId = uuidv4();
    await pool.execute(
      `INSERT INTO user_settings (
        id, userId,
        emailNotifications, pushNotifications, sessionReminders, newMessages, weeklyReports,
        profileVisibility, showOnlineStatus, allowMessages, dataSharing
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE id=id`,
      [
        studentUserSettingsId,
        studentUserId,
        true,
        false,
        true,
        true,
        false,
        "students",
        false,
        true,
        true,
      ]
    );

    console.log("✅ Created sample user settings");

    console.log("✅ Database seeding completed successfully");
    console.log("\n📝 Demo accounts:");
    console.log("Admin: admin@tutorlink.com / password");
    console.log("Tutor: tutor@tutorlink.com / password");
    console.log("Student: student@tutorlink.com / password");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
