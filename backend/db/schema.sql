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

--Attendance
CREATE TABLE attendance (
    student_id INT NOT NULL,
    program_id INT NOT NULL,
    class_no INT NOT NULL,

    status VARCHAR(20) 
    CHECK (status IN ('Present','Absent')),

    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (student_id, program_id, class_no),

    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE,

    FOREIGN KEY (program_id)
    REFERENCES programs(program_id)
    ON DELETE CASCADE
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

    comments TEXT,

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