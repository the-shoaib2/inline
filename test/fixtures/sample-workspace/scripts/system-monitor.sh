#!/bin/bash

# System Monitor Script
# Monitors CPU, memory, and disk usage

get_cpu_usage() {
    top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//'
}

get_memory_usage() {
    vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//'
}

get_disk_usage() {
    df -h / | tail -1 | awk '{print $5}' | sed 's/%//'
}

check_threshold() {
    local usage=$1
    local threshold=$2
    local metric=$3

    if [ "$usage" -gt "$threshold" ]; then
        echo "WARNING: $metric usage is ${usage}% (threshold: ${threshold}%)"
        return 1
    else
        echo "OK: $metric usage is ${usage}%"
        return 0
    fi
}

main() {
    echo "=== System Monitor ==="
    echo "Time: $(date)"
    echo ""

    # Get current usage
    cpu_usage=$(get_cpu_usage)
    mem_usage=$(get_memory_usage)
    disk_usage=$(get_disk_usage)

    # Check thresholds
    check_threshold "$cpu_usage" 80 "CPU"
    check_threshold "$mem_usage" 90 "Memory"
    check_threshold "$disk_usage" 85 "Disk"

    echo ""
    echo "=== Detailed Information ==="
    echo "CPU Usage: ${cpu_usage}%"
    echo "Free Memory Pages: ${mem_usage}"
    echo "Disk Usage: ${disk_usage}%"
}

# Run main function
main "$@"
