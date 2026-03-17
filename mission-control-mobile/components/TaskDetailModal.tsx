import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Modal, ScrollView, Alert, Switch
} from 'react-native';
import { Task, LANES, api } from '../lib/api';
import { QueuedChange } from '../lib/offline';

interface Props {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  emitChange?: (change: QueuedChange) => void;
}

const PRIORITIES = [
  { id: 'low', label: 'Low', color: '#6B7280' },
  { id: 'medium', label: 'Medium', color: '#F59E0B' },
  { id: 'high', label: 'High', color: '#EF4444' },
];

export function TaskDetailModal({ visible, task, onClose, onSave, onDelete, emitChange }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('inbox');
  const [priority, setPriority] = useState<string>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority || 'medium');
      setTags(task.tags || []);
    }
  }, [task]);

  const handleSave = async () => {
    if (!title.trim() || !task) return;
    
    setSaving(true);
    try {
      const updated = await api.updateTask(task.id, {
        title,
        description: description || undefined,
        status: status as Task['status'],
        priority: priority as Task['priority'],
        tags,
      });
      
      if (updated) {
        onSave(updated);
        
        // Emit real-time change
        if (emitChange) {
          emitChange({
            id: `change-${Date.now()}`,
            type: 'update',
            taskId: task.id,
            data: updated,
            timestamp: Date.now(),
          });
        }
        onClose();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(task!.id);
            if (emitChange) {
              emitChange({
                id: `change-${Date.now()}`,
                type: 'delete',
                taskId: task!.id,
                timestamp: Date.now(),
              });
            }
            onClose();
          },
        },
      ]
    );
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Task Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Task title..."
              placeholderTextColor="#6B7280"
            />
            
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add description..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
            />
            
            <Text style={styles.label}>Status</Text>
            <View style={styles.options}>
              {LANES.map(lane => (
                <TouchableOpacity
                  key={lane.id}
                  style={[
                    styles.option,
                    status === lane.id && { backgroundColor: lane.color },
                  ]}
                  onPress={() => setStatus(lane.id)}
                >
                  <Text style={styles.optionText}>{lane.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>Priority</Text>
            <View style={styles.options}>
              {PRIORITIES.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.option,
                    priority === p.id && { backgroundColor: p.color },
                  ]}
                  onPress={() => setPriority(p.id)}
                >
                  <Text style={styles.optionText}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>Tags</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add tag..."
                placeholderTextColor="#6B7280"
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
                <Text style={styles.addTagText}>+</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tags}>
              {tags.map(tag => (
                <TouchableOpacity key={tag} style={styles.tag} onPress={() => removeTag(tag)}>
                  <Text style={styles.tagText}>{tag} ×</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {task && (
              <View style={styles.timestamps}>
                <Text style={styles.timestamp}>Created: {new Date(task.createdAt).toLocaleString()}</Text>
                <Text style={styles.timestamp}>Updated: {new Date(task.updatedAt).toLocaleString()}</Text>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.footer}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  closeBtn: {
    fontSize: 24,
    color: '#9CA3AF',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#F9FAFB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  optionText: {
    fontSize: 14,
    color: '#FFF',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addTagBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagText: {
    fontSize: 24,
    color: '#FFF',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#4B5563',
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#F9FAFB',
  },
  timestamps: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  deleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  deleteText: {
    fontSize: 16,
    color: '#EF4444',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
});
