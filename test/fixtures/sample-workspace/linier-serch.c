// give me c graph algorithm directed graph algorithms
#include <stdio.h>

#define MAX_VERTICES 100
#define INF 1000000

typedef struct {
    int adjMatrix[MAX_VERTICES][MAX_VERTICES];
    int numVertices;
} DirectedGraph;

void initGraph(DirectedGraph* graph, int vertices) {
    graph->numVertices = vertices;
    for (int i = 0; i < vertices; i++) {
        for (int j = 0; j < vertices; j++) {
            graph->adjMatrix[i][j] = 0;
        }
    }
}

void addEdge(DirectedGraph* graph, int src, int dest) {
    graph->adjMatrix[src][dest] = 1;
}
void printGraph(DirectedGraph* graph) {
    for (int i = 0; i < graph->numVertices; i++) {
        for (int j = 0; j < graph->numVertices; j++) {
            printf("%d ", graph->adjMatrix[i][j]);
        }
        printf("\n");
    }
}
