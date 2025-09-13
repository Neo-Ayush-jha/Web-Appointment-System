# Appointment Booking System - Backend

This is the backend for the Appointment Booking System. It provides RESTful APIs for user authentication, appointment management, organization handling, and feedback collection.

# 📺 Demo Video

*Watch the full demo of the project on YouTube:*

👉 [Watch on YouTube](https://youtu.be/bFTyfSZOsXw?si=8x0C8xtFRXhIDMG5)
---

## 🚀 Features

- **JWT Authentication** for secure login/signup
- **Role-Based Access Control** (Customer, Doctor, Barber, Admin)
- **Appointment Management**: Book, cancel, reschedule
- **User & Organization Management**
- **Email Notifications** (via Nodemailer)
- **File Uploads** for feedback images
- **MySQL** with connection pooling
- **Modular Code Structure** using Express.js

---

## ⚙️ Tech Stack

- **Node.js** with **Express.js**
- **MySQL** (via `mysql2`)
- **JWT** for authentication
- **Multer** for file uploads
- **Nodemailer** for email notifications Mailtrap (https://mailtrap.io/)
- **dotenv** for environment variables
---



## 🛠️ Getting Started

### 1. Install Dependencies

```bash
npm install

```
### 2. Setup Environment Variables
Create a .env file in the root directory:
```bash
DB_HOST=maglev.proxy.rlwy.net
DB_PORT=58108
DB_USER=root
DB_PASSWORD=eNsMoCeBbndxVQXIvnPxibfZEwWjialX
DB_NAME=railway
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```
### 3. Start the Server
````bash
node server.js
````
### Project Structure
```
Appointment-System
│
├── config/
│   └── db.js               # MySQL connection
│
├── controllers/           # Business logic
│   ├── appointmentController.js
│   ├── authController.js
│   ├── feedbackController.js
│   ├── organizationController.js
│   └── userController.js
│
├── middleware/            # Custom middlewares
│   ├── auth.js
│   └── verifyAdmin.js
│
├── models/                # Database access layer
│   ├── Appointment.js
│   └── User.js
│
├── public/                # Static files (e.g., email templates)
│   └── verify.html
│
├── routes/                # Express routes
│   ├── appointments.js
│   ├── auth.js
│   ├── feedbackRoutes.js
│   ├── organizationRoutes.js
│   └── users.js
│
├── uploads/               # Uploaded images and files
│   └── feedback_images/
│
├── utils/                 # Utility functions
│   ├── mailer.js
│   └── notify.js
│
├── .env                   # Environment config
├── server.js              # Entry point
├── package.json
└── README.md
```

### User Roles
-   Customer: Can book and manage own appointments

-   Doctor/Barber: Manage their appointments and reschedule requests

-   Admin: Full access to all users, appointments, and organizations

##  API Testing with Postman

You can test all the API endpoints using the Postman collection provided below:

 [Postman Collection Link](https://documenter.getpostman.com/view/22737106/2sB3B8stPA)

###  How to Use

1. Click on the link above to open the collection in Postman.
2. Make sure your local server is running (for example: `http://localhost:5000`).
3. Import the collection and start testing your API endpoints.
4. Set environment variables if required (e.g., `token`, `base_url`, etc).

>  This collection includes routes for login, registration, CRUD operations, and more!
