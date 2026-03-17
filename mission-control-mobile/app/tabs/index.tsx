import { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, FlatList, TouchableOpacity, 
  TextInput, Modal, Alert, RefreshControl, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkState } from 'expo-network';
import { api, Task, LANES } from '../../lib/api';
import { useCollaboration, Change } from '../../lib/collaboration';
import { ConnectionStatusBadge, ActiveUsersAvatars, TypingIndicator } from '../../components/collaboration';
import { TaskDetailModal } from '../../components/TaskDetailModal';
import { offlineCache, QueuedChange } from '../../lib/offline';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedLane, setSelectedLane] = useState<string>('inbox');
  
  // Network & offline state
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  
  // Real-time collaboration
  const { connected, activeUsers, typingUsers, emitChange: emitCollabChange } = useCollaboration('tasks-room');
  
  // Load tasks with offline support
  const loadTasks = async () => {
    try {
      // Try cache first
      const cached = await offlineCache.getTasks();
      if (cached && cached.length > 0) {
        setTasks(cached);
      }
      
      // Fetch fresh data
      const data = await api.getTasks();
      setTasks(data);
      await offlineCache.setTasks(data);
    } catch (e) {
      console.error('Failed to load tasks:', e);
      // Fall back to cache on error
      const cached = await offlineCache.getTasks();
      if (cached) setTasks(cached);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check pending sync count
  const updatePendingSync = async () => {
    const queue = await offlineCache.getQueue();
    setPendingSync(queue.length);
  };

  // Network state using expo-network
  const networkState = useNetworkState();
  
  // Initial load
  useEffect(() => {
    loadTasks();
    updatePendingSync();
  }, []);
  
  useEffect(() => {
    setIsOnline(networkState.isConnected ?? false);
    
    if ((networkState.isConnected ?? false) && pendingSync > 0) {
      // Auto-sync when back online
      handleSyncQueue();
    }
  }, [networkState.isConnected]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  // Handle sync queue
  const handleSyncQueue = async () => {
    if (!isOnline) return;
    
    const synced = await offlineCache.processQueue(api, (change: Change) => {
      emitCollabChange(change);
    });
    
    if (synced > 0) {
      await loadTasks(); // Reload after sync
    }
    await updatePendingSync();
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const taskData = { 
      title: newTaskTitle, 
      status: selectedLane as Task['status'] 
    };
    
    if (!isOnline) {
      // Queue for later sync
      const tempId = `temp-${Date.now()}`;
      const tempTask: Task = {
        id: tempId,
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Optimistic update
      setTasks([...tasks, tempTask]);
      
      // Queue for sync
      await offlineCache.addToQueue({
        id: `queue-${Date.now()}`,
        type: 'create',
        taskId: tempId,
        data: taskData,
        timestamp: Date.now(),
      });
      
      await updatePendingSync();
      setNewTaskTitle('');
      setModalVisible(false);
      return;
    }
    
    const task = await api.createTask(taskData);
    if (task) {
      setTasks([...tasks, task]);
      // Emit real-time collaboration event
      emitCollabChange({
        id: `change-${Date.now()}`,
        type: 'task_created',
        taskId: task.id,
        task,
        timestamp: Date.now(),
      });
      setNewTaskTitle('');
      setModalVisible(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    if (!isOnline) {
      // Queue change
      await offlineCache.addToQueue({
        id: `queue-${Date.now()}`,
        type: 'update',
        taskId,
        data: { status: newStatus },
        timestamp: Date.now(),
      });
      
      // Optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await updatePendingSync();
      return;
    }
    
    const updated = await api.updateTask(taskId, { status: newStatus });
    if (updated) {
      setTasks(tasks.map(t => t.id === taskId ? updated : t));
      // Emit real-time collaboration event
      emitCollabChange({
        id: `change-${Date.now()}`,
        type: 'task_updated',
        taskId: taskId,
        task: updated,
        timestamp: Date.now(),
      });
    }
  };

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setDetailModalVisible(true);
  };

  const handleTaskSave = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!isOnline) {
      await offlineCache.addToQueue({
        id: `queue-${Date.now()}`,
        type: 'delete',
        taskId,
        timestamp: Date.now(),
      });
    } else {
      await api.deleteTask(taskId);
    }
    setTasks(tasks.filter(t => t.id !== taskId));
    await updatePendingSync();
  };

  const emitChange = (change: QueuedChange) => {
    // Emit WebSocket change for real-time sync
    if (change.type === 'create' && change.data) {
      emitCollabChange({
        id: change.id,
        type: 'task_created',
        taskId: change.taskId,
        task: change.data as any,
        timestamp: change.timestamp,
      });
    } else if (change.type === 'update' && change.data) {
      emitCollabChange({
        id: change.id,
        type: 'task_updated',
        taskId: change.taskId,
        task: change.data as any,
        timestamp: change.timestamp,
      });
    } else if (change.type === 'delete') {
      emitCollabChange({
        id: change.id,
        type: 'task_deleted',
        taskId: change.taskId,
        timestamp: change.timestamp,
      });
    }
  };

  const renderTask = ({ item }: { item: Task }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => handleTaskPress(item)}
    >
      <Text style={styles.taskTitle}>{item.title}</Text>
      {item.description && (
        <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
      )}
      <View style={styles.taskFooter}>
        <TouchableOpacity 
          style={styles.statusBadge}
          onPress={() => {
            const currentIdx = LANES.findIndex(l => l.id === item.status);
            const nextLane = LANES[(currentIdx + 1) % LANES.length];
            handleStatusChange(item.id, nextLane.id as Task['status']);
          }}
        >
          <Text style={styles.statusText}>
            {LANES.find(l => l.id === item.status)?.title}
          </Text>
        </TouchableOpacity>
        {item.priority && (
          <View style={[
            styles.priorityBadge,
            { backgroundColor: item.priority === 'high' ? '#EF4444' : item.priority === 'medium' ? '#F59E0B' : '#6B7280' }
          ]}>
            <Text style={styles.priorityText}>{item.priority}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderLane = (laneId: string) => {
    const laneTasks = tasks.filter(t => t.status === laneId);
    const lane = LANES.find(l => l.id === laneId);
    
    return (
      <View key={laneId} style={styles.lane}>
        <View style={[styles.laneHeader, { backgroundColor: lane?.color }]}>
          <Text style={styles.laneTitle}>{lane?.title}</Text>
          <Text style={styles.laneCount}>{laneTasks.length}</Text>
        </View>
        <FlatList
          data={laneTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          style={styles.laneList}
          ListEmptyComponent={<Text style={styles.emptyText}>No tasks</Text>}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mission Control</Text>
          <ConnectionStatusBadge connected={connected} />
        </View>
        <View style={styles.headerRight}>
          <ActiveUsersAvatars users={activeUsers} />
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
          {pendingSync > 0 && (
            <TouchableOpacity style={styles.syncBadge} onPress={handleSyncQueue}>
              <Text style={styles.syncText}>⏳ {pendingSync}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}
      
      <FlatList
        horizontal
        data={LANES}
        renderItem={({ item }) => renderLane(item.id)}
        keyExtractor={item => item.id}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* New Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task title..."
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              autoFocus
            />
            <Text style={styles.label}>Add to lane:</Text>
            <View style={styles.laneSelector}>
              {LANES.map(lane => (
                <TouchableOpacity
                  key={lane.id}
                  style={[
                    styles.laneOption,
                    selectedLane === lane.id && { backgroundColor: lane.color }
                  ]}
                  onPress={() => setSelectedLane(lane.id)}
                >
                  <Text style={styles.laneOptionText}>{lane.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={handleCreateTask}
              >
                <Text style={styles.createText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={detailModalVisible}
        task={selectedTask}
        onClose={() => setDetailModalVisible(false)}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        emitChange={emitChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  offlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  offlineText: {
    fontSize: 10,
    color: '#FFF',
  },
  syncBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  syncText: {
    fontSize: 10,
    color: '#FFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
  lane: {
    width: 300,
    marginRight: 12,
    backgroundColor: '#374151',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
    marginLeft: 4,
  },
  laneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  laneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  laneCount: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
  },
  laneList: {
    padding: 8,
    maxHeight: 500,
  },
  taskCard: {
    backgroundColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F9FAFB',
  },
  taskDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  taskFooter: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  statusText: {
    fontSize: 10,
    color: '#FFF',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFF',
    textTransform: 'capitalize',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#F9FAFB',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  laneSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  laneOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#374151',
  },
  laneOptionText: {
    fontSize: 12,
    color: '#FFF',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});
