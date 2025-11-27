import { Subtask, Task } from "../components/types";

/**
 * Converts a time string (e.g., "2h 30m") to total minutes.
 */
const timeToMinutes = (time: string | undefined): number => {
    if (!time) return 0;
    const match = time.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
    if (!match) return 0;
    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    return (hours * 60) + minutes;
};

/**
 * Converts total minutes back to a time string (e.g., "2h 30m").
 */
const minutesToTime = (totalMinutes: number): string => {
    if (totalMinutes < 0) return "0m";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "0m";
};

interface AggregationResult {
    totalStoryPoints: number;
    totalTimeSpentMinutes: number;
}

/**
 * Recursively calculates aggregated data from all nested subtasks.
 */
const getSubtaskAggregation = (subtasks: Subtask[]): AggregationResult => {
    let totalStoryPoints = 0;
    let totalTimeSpentMinutes = 0;

    const traverse = (subs: Subtask[]) => {
        subs.forEach(sub => {
            // Aggregate from current subtask
            totalStoryPoints += sub.storyPoints || 0;
            totalTimeSpentMinutes += timeToMinutes(sub.timeSpent);
            
            // Recurse into nested subtasks
            if (sub.subtasks) {
                traverse(sub.subtasks);
            }
        });
    };

    traverse(subtasks);

    return { totalStoryPoints, totalTimeSpentMinutes };
};

/**
 * Calculates the overall task data, aggregating from all subtasks.
 * @param task The main task object.
 * @returns The task object with aggregated fields.
 */
export const getAggregatedTaskData = (task: Task): Task => {
    if (!task.subtasks || task.subtasks.length === 0) {
        return { 
            ...task,
            taskTimeSpent: minutesToTime(timeToMinutes(task.taskTimeSpent)),
            taskStoryPoints: task.taskStoryPoints || 0
        };
    }

    const subtaskAgg = getSubtaskAggregation(task.subtasks);
    
    // Total Story Points: Task's own points + aggregated subtask points
    const finalStoryPoints = (task.taskStoryPoints || 0) + subtaskAgg.totalStoryPoints;

    // Total Time Spent: Task's own logged time + aggregated subtask time
    const taskOwnTimeMinutes = timeToMinutes(task.taskTimeSpent);
    const finalTimeSpentMinutes = taskOwnTimeMinutes + subtaskAgg.totalTimeSpentMinutes;

    return {
        ...task,
        taskStoryPoints: finalStoryPoints,
        taskTimeSpent: minutesToTime(finalTimeSpentMinutes),
    };
};