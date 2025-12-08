// Sample JavaScript file for testing
class UserManager {
    constructor() {
        this.users = [];
    }

    addUser(user) {
        this.users.push(user);
    }

    findUser(id) {
        return this.users.find(u => u.id === id);
    }

    async loadUsers() {
        const response = await fetch('/api/users');
        this.users = await response.json();
    }
}

// Helper functions
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

export { UserManager, validateEmail };
