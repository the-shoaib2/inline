/**
 * Language Fixture Generator
 * Creates sample code files for all supported languages
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LanguageFixture {
    language: string;
    extension: string;
    basicSyntax: string;
    classExample?: string;
    functionExample: string;
    importExample?: string;
    errorExample: string;
}

export class LanguageFixtureGenerator {
    private fixturesDir: string;

    constructor(fixturesDir: string) {
        this.fixturesDir = fixturesDir;
    }

    /**
     * Generate all language fixtures
     */
    async generateAllFixtures(): Promise<void> {
        const fixtures = this.getAllFixtures();
        
        for (const fixture of fixtures) {
            await this.createFixture(fixture);
        }
    }

    /**
     * Create a single fixture file
     */
    private async createFixture(fixture: LanguageFixture): Promise<void> {
        const langDir = path.join(this.fixturesDir, fixture.language);
        await fs.promises.mkdir(langDir, { recursive: true });

        // Basic syntax file
        const basicFile = path.join(langDir, `basic${fixture.extension}`);
        await fs.promises.writeFile(basicFile, fixture.basicSyntax);

        // Class example (if applicable)
        if (fixture.classExample) {
            const classFile = path.join(langDir, `class-example${fixture.extension}`);
            await fs.promises.writeFile(classFile, fixture.classExample);
        }

        // Function example
        const funcFile = path.join(langDir, `function-example${fixture.extension}`);
        await fs.promises.writeFile(funcFile, fixture.functionExample);

        // Import example (if applicable)
        if (fixture.importExample) {
            const importFile = path.join(langDir, `import-example${fixture.extension}`);
            await fs.promises.writeFile(importFile, fixture.importExample);
        }

        // Error example
        const errorFile = path.join(langDir, `error-example${fixture.extension}`);
        await fs.promises.writeFile(errorFile, fixture.errorExample);

        console.log(`Created fixtures for ${fixture.language}`);
    }

    /**
     * Get all language fixtures
     */
    private getAllFixtures(): LanguageFixture[] {
        return [
            // TypeScript
            {
                language: 'typescript',
                extension: '.ts',
                basicSyntax: `// TypeScript Basic Syntax
const greeting: string = "Hello, World!";
let count: number = 0;

function add(a: number, b: number): number {
    return a + b;
}

const multiply = (a: number, b: number): number => a * b;
`,
                classExample: `// TypeScript Class Example
interface User {
    id: number;
    name: string;
    email: string;
}

class UserService {
    private users: User[] = [];

    addUser(user: User): void {
        this.users.push(user);
    }

    getUser(id: number): User | undefined {
        return this.users.find(u => u.id === id);
    }

    getAllUsers(): User[] {
        return [...this.users];
    }
}

export { User, UserService };
`,
                functionExample: `// TypeScript Function Examples
async function fetchData(url: string): Promise<any> {
    const response = await fetch(url);
    return response.json();
}

function* generateNumbers(max: number): Generator<number> {
    for (let i = 0; i < max; i++) {
        yield i;
    }
}

type Callback<T> = (value: T) => void;

function processData<T>(data: T[], callback: Callback<T>): void {
    data.forEach(callback);
}
`,
                importExample: `import { User, UserService } from './class-example';
import * as utils from './utils';
import type { Config } from './types';

const service = new UserService();
`,
                errorExample: `// TypeScript Syntax Errors
const x: number = "string"; // Type error
function broken( // Missing closing parenthesis
    return undefined;
}

let undeclared = unknownVariable; // Undefined variable
`
            },

            // Python
            {
                language: 'python',
                extension: '.py',
                basicSyntax: `# Python Basic Syntax
greeting = "Hello, World!"
count = 0

def add(a, b):
    return a + b

multiply = lambda a, b: a * b
`,
                classExample: `# Python Class Example
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class User:
    id: int
    name: str
    email: str

class UserService:
    def __init__(self):
        self.users: List[User] = []
    
    def add_user(self, user: User) -> None:
        self.users.append(user)
    
    def get_user(self, user_id: int) -> Optional[User]:
        return next((u for u in self.users if u.id == user_id), None)
    
    def get_all_users(self) -> List[User]:
        return self.users.copy()
`,
                functionExample: `# Python Function Examples
async def fetch_data(url: str) -> dict:
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

def generator_example(max_value: int):
    for i in range(max_value):
        yield i

def decorator_example(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@decorator_example
def greet(name: str) -> str:
    return f"Hello, {name}!"
`,
                importExample: `from class_example import User, UserService
import utils
from typing import List, Dict, Optional

service = UserService()
`,
                errorExample: `# Python Syntax Errors
def broken(
    return None  # Missing closing parenthesis

x = undefined_variable  # NameError
result = 10 / 0  # ZeroDivisionError
`
            },

            // JavaScript
            {
                language: 'javascript',
                extension: '.js',
                basicSyntax: `// JavaScript Basic Syntax
const greeting = "Hello, World!";
let count = 0;

function add(a, b) {
    return a + b;
}

const multiply = (a, b) => a * b;
`,
                classExample: `// JavaScript Class Example
class User {
    constructor(id, name, email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
}

class UserService {
    constructor() {
        this.users = [];
    }

    addUser(user) {
        this.users.push(user);
    }

    getUser(id) {
        return this.users.find(u => u.id === id);
    }

    getAllUsers() {
        return [...this.users];
    }
}

export { User, UserService };
`,
                functionExample: `// JavaScript Function Examples
async function fetchData(url) {
    const response = await fetch(url);
    return response.json();
}

function* generateNumbers(max) {
    for (let i = 0; i < max; i++) {
        yield i;
    }
}

const processData = (data, callback) => {
    data.forEach(callback);
};
`,
                importExample: `import { User, UserService } from './class-example.js';
import * as utils from './utils.js';

const service = new UserService();
`,
                errorExample: `// JavaScript Syntax Errors
const x = ; // Missing value
function broken( // Missing closing parenthesis
    return undefined;
}

let result = undeclaredVariable; // ReferenceError
`
            },

            // Java
            {
                language: 'java',
                extension: '.java',
                basicSyntax: `// Java Basic Syntax
public class Basic {
    public static void main(String[] args) {
        String greeting = "Hello, World!";
        int count = 0;
        
        System.out.println(greeting);
    }
    
    public static int add(int a, int b) {
        return a + b;
    }
}
`,
                classExample: `// Java Class Example
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class User {
    private int id;
    private String name;
    private String email;
    
    public User(int id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
    
    public int getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
}

public class UserService {
    private List<User> users = new ArrayList<>();
    
    public void addUser(User user) {
        users.add(user);
    }
    
    public Optional<User> getUser(int id) {
        return users.stream()
            .filter(u -> u.getId() == id)
            .findFirst();
    }
    
    public List<User> getAllUsers() {
        return new ArrayList<>(users);
    }
}
`,
                functionExample: `// Java Function Examples
import java.util.concurrent.CompletableFuture;
import java.util.function.Function;

public class Functions {
    public static CompletableFuture<String> fetchDataAsync(String url) {
        return CompletableFuture.supplyAsync(() -> {
            // Fetch data
            return "data";
        });
    }
    
    public static <T, R> R processData(T data, Function<T, R> processor) {
        return processor.apply(data);
    }
}
`,
                importExample: `import java.util.*;
import java.io.*;
import com.example.User;
import com.example.UserService;
`,
                errorExample: `// Java Syntax Errors
public class Broken {
    public static void main(String[] args) {
        int x = "string"; // Type error
        System.out.println(undeclared); // Undefined variable
    } // Missing closing brace
`
            },

            // Go
            {
                language: 'go',
                extension: '.go',
                basicSyntax: `// Go Basic Syntax
package main

import "fmt"

func main() {
    greeting := "Hello, World!"
    count := 0
    
    fmt.Println(greeting)
    fmt.Println(add(5, 3))
}

func add(a, b int) int {
    return a + b
}
`,
                classExample: `// Go Struct Example
package main

type User struct {
    ID    int
    Name  string
    Email string
}

type UserService struct {
    users []User
}

func NewUserService() *UserService {
    return &UserService{
        users: make([]User, 0),
    }
}

func (s *UserService) AddUser(user User) {
    s.users = append(s.users, user)
}

func (s *UserService) GetUser(id int) *User {
    for _, user := range s.users {
        if user.ID == id {
            return &user
        }
    }
    return nil
}

func (s *UserService) GetAllUsers() []User {
    return s.users
}
`,
                functionExample: `// Go Function Examples
package main

import (
    "context"
    "fmt"
)

func fetchData(ctx context.Context, url string) (string, error) {
    // Fetch data
    return "data", nil
}

func processData(data []int, fn func(int) int) []int {
    result := make([]int, len(data))
    for i, v := range data {
        result[i] = fn(v)
    }
    return result
}

func generator(max int) <-chan int {
    ch := make(chan int)
    go func() {
        for i := 0; i < max; i++ {
            ch <- i
        }
        close(ch)
    }()
    return ch
}
`,
                importExample: `package main

import (
    "fmt"
    "net/http"
    "encoding/json"
    
    "github.com/example/user"
    "github.com/example/service"
)
`,
                errorExample: `// Go Syntax Errors
package main

func broken( {  // Missing parameter list
    return
}

func main() {
    x := undeclared  // Undefined variable
    var y int = "string"  // Type mismatch
`
            },

            // Rust
            {
                language: 'rust',
                extension: '.rs',
                basicSyntax: `// Rust Basic Syntax
fn main() {
    let greeting = "Hello, World!";
    let mut count = 0;
    
    println!("{}", greeting);
    println!("{}", add(5, 3));
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}
`,
                classExample: `// Rust Struct Example
#[derive(Debug, Clone)]
pub struct User {
    pub id: u32,
    pub name: String,
    pub email: String,
}

pub struct UserService {
    users: Vec<User>,
}

impl UserService {
    pub fn new() -> Self {
        UserService {
            users: Vec::new(),
        }
    }
    
    pub fn add_user(&mut self, user: User) {
        self.users.push(user);
    }
    
    pub fn get_user(&self, id: u32) -> Option<&User> {
        self.users.iter().find(|u| u.id == id)
    }
    
    pub fn get_all_users(&self) -> &[User] {
        &self.users
    }
}
`,
                functionExample: `// Rust Function Examples
use std::future::Future;

async fn fetch_data(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    // Fetch data
    Ok("data".to_string())
}

fn process_data<T, F>(data: Vec<T>, f: F) -> Vec<T>
where
    F: Fn(T) -> T,
{
    data.into_iter().map(f).collect()
}

fn generator(max: usize) -> impl Iterator<Item = usize> {
    (0..max).into_iter()
}
`,
                importExample: `use std::collections::HashMap;
use std::io::{self, Read};

mod user;
mod service;

use user::User;
use service::UserService;
`,
                errorExample: `// Rust Syntax Errors
fn broken( {  // Missing parameter list
    return;
}

fn main() {
    let x: i32 = "string";  // Type error
    let y = undeclared;  // Undefined variable
`
            }
        ];
    }
}
