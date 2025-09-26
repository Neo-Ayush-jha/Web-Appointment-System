const pool = require("./config/db");

async function initializeDatabase() {
  try {
    await pool.query(`CREATE DATABASE IF NOT EXISTS db_appointment`);
    await pool.query(`USE db_appointment`);

    // Step 1: Create Organizations Table
    await pool.query(`
        CREATE TABLE IF NOT EXISTS organizations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          established_date DATE,
          address TEXT,
          phone VARCHAR(20),
          email VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

    // Step 2: Create Users Table (linked to organization)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role ENUM('doctor', 'barber', 'customer', 'admin') DEFAULT 'customer',
        is_verified BOOLEAN DEFAULT FALSE,
        organization_id INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
          ON DELETE SET NULL
      )
    `);

    // Step 3: Create Appointments Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        professional_id INT,
        date DATE,
        time TIME,
        pending_date DATE DEFAULT NULL,
        pending_time TIME DEFAULT NULL,
        status ENUM('scheduled', 'booked', 'cancelled', 'rescheduled', 'pending_reschedule', 'completed') DEFAULT 'scheduled',
        service VARCHAR(255),
        duration INT,
        price DECIMAL(10,2),
        notes TEXT,
        is_approved BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (professional_id) REFERENCES users(id)
      )
    `);

    // Step 4: Create Feedbacks Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        user_id INT NOT NULL,
        professional_id INT NOT NULL,
        rating FLOAT NOT NULL,
        experience TEXT,
        suggestion TEXT,
        image_url VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (appointment_id) REFERENCES appointments(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (professional_id) REFERENCES users(id)
      )
    `);

    // Step 5: Create Chats Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        appointment_id INT NOT NULL,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Database and tables are ready");
  } catch (error) {
    console.error("Error initializing DB:", error);
  }
}

module.exports = initializeDatabase;
