--Programs
CREATE TABLE programs (
    program_id SERIAL PRIMARY KEY,
    program_name VARCHAR(150) NOT NULL,
    program_incharge VARCHAR(150),
    total_class INT NOT NULL
);

--Students
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    batch INT
);

-- Admin
CREATE TABLE admins (
    admin_id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

--Enrollment
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    program_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE,

    FOREIGN KEY (program_id)
    REFERENCES programs(program_id)
    ON DELETE CASCADE,

    UNIQUE(student_id, program_id)
);

--Permission
CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL
);

--Class
CREATE TABLE classes (
    class_id SERIAL PRIMARY KEY,
    program_id INT,
    class_date DATE,
    topic VARCHAR(200),

    FOREIGN KEY (program_id)
    REFERENCES programs(program_id)
    ON DELETE CASCADE
);

--Attendance
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    student_id INT,
    class_id INT,
    status VARCHAR(20) CHECK (status IN ('Present','Absent','Late')),
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE,

    FOREIGN KEY (class_id)
    REFERENCES classes(class_id)
    ON DELETE CASCADE,

    UNIQUE(student_id, class_id)
);

--Admin Program Permission
CREATE TABLE admin_program_permissions (
    id SERIAL PRIMARY KEY,
    admin_id INT,
    program_id INT,
    permission_id INT,

    FOREIGN KEY (admin_id)
    REFERENCES admins(admin_id)
    ON DELETE CASCADE,

    FOREIGN KEY (program_id)
    REFERENCES programs(program_id)
    ON DELETE CASCADE,

    FOREIGN KEY (permission_id)
    REFERENCES permissions(permission_id)
    ON DELETE CASCADE,

    UNIQUE(admin_id, program_id, permission_id)
);

--Assignments Table
CREATE TABLE assignments (
    assignment_id SERIAL PRIMARY KEY,

    program_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,
    description TEXT,

    deadline DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (program_id)
    REFERENCES programs(program_id)
    ON DELETE CASCADE
);

--Submission Table
CREATE TABLE submissions (
    submission_id SERIAL PRIMARY KEY,

    student_id INT NOT NULL,
    assignment_id INT NOT NULL,

    status VARCHAR(20) 
    CHECK (status IN ('Pending','Submitted')) 
    DEFAULT 'Pending',

    score INT,

    submitted_at TIMESTAMP,

    file_url TEXT,   -- for future file upload

    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE,

    FOREIGN KEY (assignment_id)
    REFERENCES assignments(assignment_id)
    ON DELETE CASCADE,

    UNIQUE(student_id, assignment_id)
);