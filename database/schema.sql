CREATE TABLE mentors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    expertise VARCHAR(100),
    seniority VARCHAR(50),
    email VARCHAR(100)
);

INSERT INTO mentors (name, expertise, seniority, email) VALUES
('Jane Doe', 'Web Development', 'Senior', 'jane@example.com'),
('Janice Doe', 'Data Science', 'Mid-Level', 'janice@example.com');