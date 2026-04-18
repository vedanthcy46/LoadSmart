import { Clock, CheckCircle2, Circle, User, PlayCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function TaskCard({ task, onStatusChange }) {
  const { user } = useAuth();
  const priorityColors = {
    High: 'bg-rose-100 text-rose-700 border-rose-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const statusIcons = {
    Pending: Circle,
    'In Progress': PlayCircle,
    Completed: CheckCircle2
  };

  const isAssignedToMe = typeof task.assignedTo === 'object' 
    ? task.assignedTo.userId === user?.id 
    : task.assignedTo === user?.id;

  const isOffloaded = task.previousAssignee === user?.id && !isAssignedToMe;

  const statusColors = {
    Pending: 'text-slate-400',
    'In Progress': 'text-blue-500',
    Completed: 'text-emerald-500'
  };

  const StatusIcon = statusIcons[task.status] || Circle;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon className={`w-4 h-4 ${isOffloaded ? 'text-slate-300' : (statusColors[task.status] || '')}`} />
            <h3 className={`font-semibold ${isOffloaded ? 'text-slate-400' : 'text-slate-800'}`}>
              {task.title} {isOffloaded && <span className="text-[10px] font-normal italic">(Reassigned)</span>}
            </h3>
          </div>
          {task.description && (
            <p className="text-sm text-slate-500 line-clamp-2">{task.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-md border ${priorityColors[task.priority] || ''}`}>
            {task.priority ? task.priority.toUpperCase() : ''}
          </span>
          {isOffloaded && (
            <span className="px-2 py-1 text-[10px] font-bold rounded-md border bg-slate-100 text-slate-500 border-slate-200">
              OFFLOADED
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-3">
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-medium text-slate-600">Skills:</span>
          {task.requiredSkills?.map((skill, index) => (
            <span key={index} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{skill}</span>
          )) || <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{task.requiredSkill}</span>}
        </div>
        {task.estimatedHours && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{task.estimatedHours}h</span>
          </div>
        )}
      </div>

      {task.assignedTo && (
        <div className="flex items-center gap-2 text-sm mb-3">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600">
            {typeof task.assignedTo === 'object' ? task.assignedTo.name : 'Assigned'}
          </span>
        </div>
      )}

      {task.aiExplanation && (
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-3 mb-3 border border-cyan-100">
          <p className="text-xs text-cyan-700">
            <span className="font-medium">AI Insight: </span>
            {task.aiExplanation}
          </p>
        </div>
      )}

      {task.status !== 'Completed' && onStatusChange && isAssignedToMe && (
        <div className="flex gap-2 pt-2 border-t border-slate-100">
          {user?.role === 'employee' && task.status === 'Pending' && (
            <button
              onClick={() => onStatusChange(task._id, 'In Progress')}
              className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4" />
              Start Task
            </button>
          )}
          {user?.role === 'admin' && task.status === 'In Progress' && (
            <button
              onClick={() => onStatusChange(task._id, 'Completed')}
              className="flex-1 px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verify & Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
