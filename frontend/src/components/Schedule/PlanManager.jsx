import React, { useState, useRef } from 'react';
import { Plus, Trash2, Upload, Target, CheckCircle2, Circle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useStudyStore } from '../../stores/studyStore';
import { IMPORTANCE_LEVELS, getImportanceStyles } from './ScheduleUtils';

export const PlanManager = () => {
  const { plans, addPlan, updatePlan, deletePlan, importPlansFromJson } = useStudyStore();
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const fileInputRef = useRef(null);

  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanImportance, setNewPlanImportance] = useState(2);

  const [newTaskTitles, setNewTaskTitles] = useState({});

  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;
    addPlan({
      title: newPlanTitle,
      importance: Number(newPlanImportance),
      tasks: []
    });
    setNewPlanTitle('');
    setNewPlanImportance(2);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        
        if (json.type === 'bundle') {
          const { importSchedulesFromJson, importPlansFromJson } = useStudyStore.getState();
          let msg = [];
          if (json.plans) {
            await importPlansFromJson(json.plans);
            msg.push(`${json.plans.length} kế hoạch`);
          }
          if (json.schedules) {
            await importSchedulesFromJson(json.schedules);
            msg.push(`${json.schedules.length} ca học`);
          }
          alert(`Đã nhập thành công: ${msg.join(', ')}!`);
        } else if (json.type === 'schedules' && Array.isArray(json.data)) {
          const { importSchedulesFromJson } = useStudyStore.getState();
          await importSchedulesFromJson(json.data);
          alert(`Đã nhập thành công ${json.data.length} ca học!`);
        } else {
          const plansToImport = Array.isArray(json) ? json : [json];
          const { importPlansFromJson } = useStudyStore.getState();
          await importPlansFromJson(plansToImport);
          alert(`Đã nhập thành công ${plansToImport.length} kế hoạch!`);
        }
      } catch (err) {
        alert('Lỗi khi đọc file JSON. Vui lòng kiểm tra lại định dạng.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddTask = (planId) => {
    const title = newTaskTitles[planId];
    if (!title?.trim()) return;

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      isDone: false,
      importance: plan.importance
    };

    updatePlan(planId, { tasks: [...(plan.tasks || []), newTask] });
    setNewTaskTitles(prev => ({ ...prev, [planId]: '' }));
  };

  const toggleTaskDone = (planId, taskId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const updatedTasks = plan.tasks.map(t => 
      t.id === taskId ? { ...t, isDone: !t.isDone } : t
    );
    updatePlan(planId, { tasks: updatedTasks });
  };

  const deleteTask = (planId, taskId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    updatePlan(planId, { tasks: plan.tasks.filter(t => t.id !== taskId) });
  };

  return (
    <div className="glass-card p-5 sm:p-6 rounded-3xl shadow-xs animate-in fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Quản Lý Kế Hoạch</h2>
        </div>
        <div>
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Tải file JSON</span>
          </button>
        </div>
      </div>

      {/* Form thêm kế hoạch */}
      <form onSubmit={handleAddPlan} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Tên kế hoạch mới..."
          value={newPlanTitle}
          onChange={(e) => setNewPlanTitle(e.target.value)}
          className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 outline-none"
        />
        <select
          value={newPlanImportance}
          onChange={(e) => setNewPlanImportance(e.target.value)}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none dark:text-slate-100"
        >
          {Object.values(IMPORTANCE_LEVELS).map(level => (
            <option key={level.id} value={level.id}>{level.label}</option>
          ))}
        </select>
        <button 
          type="submit"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm
        </button>
      </form>

      {/* Danh sách kế hoạch */}
      <div className="space-y-3">
        {plans.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500 dark:text-slate-400">
            Chưa có kế hoạch nào. Hãy tạo mới hoặc tải lên file JSON.
          </div>
        ) : (
          plans.map(plan => {
            const isExpanded = expandedPlanId === plan.id;
            const progress = plan.tasks?.length ? Math.round((plan.tasks.filter(t => t.isDone).length / plan.tasks.length) * 100) : 0;

            return (
              <div key={plan.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                {/* Plan Header */}
                <div 
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${getImportanceStyles(plan.importance)} border-l-4 rounded-l-none`}
                  onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm">{plan.title}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20 font-semibold">
                        {IMPORTANCE_LEVELS[plan.importance]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className="h-full bg-current opacity-50" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold">{progress}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="w-5 h-5 opacity-50" /> : <ChevronDown className="w-5 h-5 opacity-50" />}
                  </div>
                </div>

                {/* Plan Tasks */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Thêm việc vào kế hoạch..."
                        value={newTaskTitles[plan.id] || ''}
                        onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [plan.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(plan.id); }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none dark:text-slate-200"
                      />
                      <button 
                        onClick={() => handleAddTask(plan.id)}
                        className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg"
                      >
                        Thêm
                      </button>
                    </div>

                    <div className="space-y-2">
                      {!plan.tasks?.length ? (
                        <div className="text-xs text-slate-400 text-center py-2">Chưa có công việc nào</div>
                      ) : (
                        plan.tasks.map(task => (
                          <div key={task.id} className="flex items-start gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 group">
                            <button onClick={() => toggleTaskDone(plan.id, task.id)} className="mt-0.5">
                              {task.isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                              )}
                            </button>
                            <span className={`flex-1 text-sm ${task.isDone ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>
                              {task.title}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => deleteTask(plan.id, task.id)}
                                className="p-1 text-slate-400 hover:text-rose-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
