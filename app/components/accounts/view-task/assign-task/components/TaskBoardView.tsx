import React, { useMemo } from 'react';
import { Task } from '../page';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from '@hello-pangea/dnd';

interface TaskBoardViewProps {
    tasks: Task[];
    openTaskModal: (task: Task) => void;
    onTaskStatusChange: (taskId: string, newStatus: string) => void;
}

const statusColumns = [
    { title: "To Do (Backlog)", status: "Backlog" },
    { title: "In Progress (Sprint)", status: "In Progress" },
    { title: "Paused", status: "Paused" },
    { title: "Dev Review", status: "Dev Review" },
    { title: "Deployed in QA", status: "Deployed in QA" },
    { title: "Test In Progress", status: "Test In Progress" },
    { title: "QA Sign Off", status: "QA Sign Off" },
    { title: "Deployment Stage", status: "Deployment Stage" },
    { title: "Pilot Test", status: "Pilot Test" },
    { title: "Done", status: "Completed" },
];

const getProgressBarColor = (completion: number) => {
    if (completion === 100) return 'bg-green-500';
    if (completion >= 70) return 'bg-blue-500';
    if (completion >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
};

const TaskCard: React.FC<{ task: Task, index: number, openTaskModal: (task: Task) => void }> = ({ task, index, openTaskModal }) => (
    <Draggable draggableId={task._id} index={index}>
        {(provided, snapshot) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`bg-white p-4 rounded-xl border border-gray-300 cursor-pointer transition-all duration-200 shadow-sm
                    ${snapshot.isDragging ? 'scale-[1.03] shadow-md' : 'hover:shadow-md hover:scale-[1.02]'}`}
                onClick={() => openTaskModal(task)}
            >
                <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-900">{task.project}</p>
                </div>

                <p className="text-xs text-slate-500 mb-2">{task.projectId}</p>

                <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-slate-700">
                        <span className="text-slate-500">Assignee:</span> {task.assigneeName}
                    </p>
                    <div className="bg-gray-100 text-slate-900 text-xs px-3 py-1 rounded-full font-medium">
                        {task.completion}%
                    </div>
                </div>

                <div className="mt-3 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`${getProgressBarColor(task.completion)} h-full rounded-full`}
                        style={{ width: `${task.completion}%` }}
                    />
                </div>
            </div>
        )}
    </Draggable>
);

const TaskBoardView: React.FC<TaskBoardViewProps> = ({ tasks, openTaskModal, onTaskStatusChange }) => {

    const tasksByStatus = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const status = task.status || 'Backlog';
            if (!acc[status]) acc[status] = [];
            acc[status].push(task);
            return acc;
        }, {} as { [key: string]: Task[] });
    }, [tasks]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;
        onTaskStatusChange(draggableId, destination.droppableId);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex space-x-5 overflow-x-auto pb-6 px-2">

                {statusColumns.map((column) => (
                    <Droppable droppableId={column.status} key={column.status}>
                        {(provided, snapshot) => (
                            <div 
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex-shrink-0 w-80"
                            >

                                {/* Column Header (1px grey outline) */}
                                <div className="bg-white text-slate-900 p-4 rounded-t-xl border border-gray-300 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-base">{column.title}</h3>
                                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-slate-700">
                                            {tasksByStatus[column.status]?.length || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Column body (1px grey outline) */}
                                <div 
                                    className={`space-y-3 p-4 min-h-[500px] rounded-b-xl border border-gray-300 transition-all duration-200
                                        ${snapshot.isDraggingOver ? 'bg-white shadow-md' : 'bg-white'}`}
                                >
                                    {(tasksByStatus[column.status] || []).map((task, index) => (
                                        <TaskCard 
                                            key={task._id} 
                                            task={task} 
                                            index={index} 
                                            openTaskModal={openTaskModal} 
                                        />
                                    ))}

                                    {provided.placeholder}

                                    {(!tasksByStatus[column.status] || tasksByStatus[column.status].length === 0) && (
                                        <div className="text-center py-8 text-slate-500 text-sm">
                                            No tasks
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </Droppable>
                ))}

            </div>
        </DragDropContext>
    );
};

export default TaskBoardView;
