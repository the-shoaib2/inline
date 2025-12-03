#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_TASKS 100
#define MAX_DESC_LENGTH 256

typedef struct {
    int id;
    char description[MAX_DESC_LENGTH];
    int priority;
    time_t created_at;
    int completed;
} Task;

typedef struct {
    Task tasks[MAX_TASKS];
    int count;
} TaskManager;

void init_task_manager(TaskManager* tm) {
    tm->count = 0;
}

int add_task(TaskManager* tm, const char* description, int priority) {
    if (tm->count >= MAX_TASKS) {
        return -1;
    }

    Task* task = &tm->tasks[tm->count];
    task->id = tm->count + 1;
    strncpy(task->description, description, MAX_DESC_LENGTH - 1);
    task->description[MAX_DESC_LENGTH - 1] = '\0';
    task->priority = priority;
    task->created_at = time(NULL);
    task->completed = 0;

    tm->count++;
    return task->id;
}

void complete_task(TaskManager* tm, int task_id) {
    for (int i = 0; i < tm->count; i++) {
        if (tm->tasks[i].id == task_id) {
            tm->tasks[i].completed = 1;
            break;
        }
    }
}

void list_tasks(const TaskManager* tm) {
    printf("=== Task List ===\n");
    for (int i = 0; i < tm->count; i++) {
        const Task* task = &tm->tasks[i];
        printf("[%d] %s (Priority: %d) %s\n",
               task->id,
               task->description,
               task->priority,
               task->completed ? "[COMPLETED]" : "[PENDING]");
    }
}

int compare_tasks(const void* a, const void* b) {
    const Task* task_a = (const Task*)a;
    const Task* task_b = (const Task*)b;

    // Sort by priority (high to low), then by creation time
    if (task_a->priority != task_b->priority) {
        return task_b->priority - task_a->priority;
    }
    return (int)(task_a->created_at - task_b->created_at);
}

void sort_tasks(TaskManager* tm) {
    qsort(tm->tasks, tm->count, sizeof(Task), compare_tasks);
}

int main() {
    TaskManager tm;
    init_task_manager(&tm);

    // Add some sample tasks
    add_task(&tm, "Implement user authentication", 1);
    add_task(&tm, "Write unit tests", 2);
    add_task(&tm, "Update documentation", 3);
    add_task(&tm, "Fix memory leak in module", 1);

    printf("Original order:\n");
    list_tasks(&tm);

    printf("\nSorted by priority:\n");
    sort_tasks(&tm);
    list_tasks(&tm);

    // Complete a task
    complete_task(&tm, 2);
    printf("\nAfter completing task 2:\n");
    list_tasks(&tm);

    return 0;
}
