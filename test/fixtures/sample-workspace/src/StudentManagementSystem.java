import java.util.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class StudentManagementSystem {

    static class Student {
        private int id;
        private String name;
        private String email;
        private Map<String, Double> grades;
        private LocalDateTime enrollmentDate;

        public Student(int id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.grades = new HashMap<>();
            this.enrollmentDate = LocalDateTime.now();
        }

        public void addGrade(String subject, double grade) {
            grades.put(subject, grade);
        }

        public double calculateAverage() {
            if (grades.isEmpty()) {
                return 0.0;
            }

            double sum = 0.0;
            for (double grade : grades.values()) {
                sum += grade;
            }
            return sum / grades.size();
        }

        public String getGradeLevel() {
            double average = calculateAverage();
            if (average >= 90) return "A";
            else if (average >= 80) return "B";
            else if (average >= 70) return "C";
            else if (average >= 60) return "D";
            else return "F";
        }

        @Override
        public String toString() {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            return String.format("Student[ID: %d, Name: %s, Email: %s, Average: %.2f, Grade: %s, Enrolled: %s]",
                    id, name, email, calculateAverage(), getGradeLevel(),
                    enrollmentDate.format(formatter));
        }
    }

    static class Course {
        private String courseCode;
        private String courseName;
        private int credits;
        private Map<Integer, Student> enrolledStudents;

        public Course(String courseCode, String courseName, int credits) {
            this.courseCode = courseCode;
            this.courseName = courseName;
            this.credits = credits;
            this.enrolledStudents = new HashMap<>();
        }

        public void enrollStudent(Student student) {
            enrolledStudents.put(student.id, student);
        }

        public void calculateCourseStatistics() {
            if (enrolledStudents.isEmpty()) {
                System.out.println("No students enrolled in " + courseName);
                return;
            }

            double totalAverage = 0.0;
            Map<String, Integer> gradeDistribution = new HashMap<>();
            gradeDistribution.put("A", 0);
            gradeDistribution.put("B", 0);
            gradeDistribution.put("C", 0);
            gradeDistribution.put("D", 0);
            gradeDistribution.put("F", 0);

            for (Student student : enrolledStudents.values()) {
                totalAverage += student.calculateAverage();
                String grade = student.getGradeLevel();
                gradeDistribution.put(grade, gradeDistribution.get(grade) + 1);
            }

            double classAverage = totalAverage / enrolledStudents.size();

            System.out.println("=== Course Statistics ===");
            System.out.println("Course: " + courseCode + " - " + courseName);
            System.out.println("Enrolled Students: " + enrolledStudents.size());
            System.out.println("Class Average: " + String.format("%.2f", classAverage));
            System.out.println("Grade Distribution:");
            for (Map.Entry<String, Integer> entry : gradeDistribution.entrySet()) {
                System.out.println("  " + entry.getKey() + ": " + entry.getValue() + " students");
            }
        }
    }

    public static void main(String[] args) {
        // Create students
        Student alice = new Student(1, "Alice Johnson", "alice@university.edu");
        Student bob = new Student(2, "Bob Smith", "bob@university.edu");
        Student charlie = new Student(3, "Charlie Brown", "charlie@university.edu");

        // Add grades for Computer Science course
        alice.addGrade("Programming", 95.0);
        alice.addGrade("Algorithms", 88.0);
        alice.addGrade("Database", 92.0);

        bob.addGrade("Programming", 78.0);
        bob.addGrade("Algorithms", 85.0);
        bob.addGrade("Database", 72.0);

        charlie.addGrade("Programming", 92.0);
        charlie.addGrade("Algorithms", 89.0);
        charlie.addGrade("Database", 94.0);

        // Create course and enroll students
        Course csCourse = new Course("CS101", "Introduction to Computer Science", 3);
        csCourse.enrollStudent(alice);
        csCourse.enrollStudent(bob);
        csCourse.enrollStudent(charlie);

        // Display student information
        System.out.println("=== Student Information ===");
        System.out.println(alice);
        System.out.println(bob);
        System.out.println(charlie);

        System.out.println();

        // Display course statistics
        csCourse.calculateCourseStatistics();

        // Find top student
        Map<Integer, Student> allStudents = new HashMap<>();
        allStudents.put(alice.id, alice);
        allStudents.put(bob.id, bob);
        allStudents.put(charlie.id, charlie);

        Student topStudent = allStudents.values().stream()
                .max(Comparator.comparing(Student::calculateAverage))
                .orElse(null);

        if (topStudent != null) {
            System.out.println("\nTop Student: " + topStudent.name +
                             " (Average: " + String.format("%.2f", topStudent.calculateAverage()) + ")");
        }
    }
}
