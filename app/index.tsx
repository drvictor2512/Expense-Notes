import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addExpense, deleteExpense, getAllExpenses, initDB, togglePaidStatus, updateExpense } from "./lib/db";

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  paid: number;
  created_at: number;
}

export default function Index() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      await initDB();
      const data = await getAllExpenses();
      setExpenses(data);
      console.log('Đã tải', data.length, 'khoản chi tiêu');
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const handleAddExpense = async () => {
    if (!newTitle.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề chi tiêu');
      return;
    }
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ (> 0)');
      return;
    }

    try {
      if (editMode && editingExpense) {
        await updateExpense(editingExpense.id, newTitle.trim(), amount, newCategory.trim());
        Alert.alert('Thành công', 'Đã cập nhật khoản chi tiêu');
      } else {
        await addExpense(newTitle.trim(), amount, newCategory.trim());
        Alert.alert('Thành công', 'Đã thêm khoản chi tiêu mới');
      }

      setNewTitle('');
      setNewAmount('');
      setNewCategory('');
      setModalVisible(false);
      setEditMode(false);
      setEditingExpense(null);
      await loadExpenses();
    } catch (error) {
      console.error('Lỗi khi lưu chi tiêu:', error);
      Alert.alert('Lỗi', 'Không thể lưu khoản chi tiêu');
    }
  };

  const handleCancelModal = () => {
    setNewTitle('');
    setNewAmount('');
    setNewCategory('');
    setModalVisible(false);
    setEditMode(false);
    setEditingExpense(null);
  };

  const handleEditExpense = (item: Expense) => {
    setEditMode(true);
    setEditingExpense(item);
    setNewTitle(item.title);
    setNewAmount(item.amount.toString());
    setNewCategory(item.category || '');
    setModalVisible(true);
  };

  const handleTogglePaid = async (item: Expense) => {
    try {
      await togglePaidStatus(item.id, item.paid);
      await loadExpenses();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
    }
  };

  const handleDeleteExpense = (item: Expense) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa "${item.title}"?\nSố tiền: ${formatAmount(item.amount)}`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(item.id);
              await loadExpenses();
              Alert.alert('Thành công', 'Đã xóa khoản chi tiêu');
            } catch (error) {
              console.error('Lỗi khi xóa chi tiêu:', error);
              Alert.alert('Lỗi', 'Không thể xóa khoản chi tiêu');
            }
          },
        },
      ]
    );
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseItemContainer}>
      <TouchableOpacity
        style={styles.expenseItem}
        onPress={() => handleTogglePaid(item)}
        onLongPress={() => handleEditExpense(item)}
        activeOpacity={0.7}
      >
        <View style={styles.expenseInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.category}>{item.category || 'Chưa phân loại'}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.amount}>{formatAmount(item.amount)}</Text>
          <View style={[styles.paidBadge, item.paid ? styles.paidBadgeGreen : styles.paidBadgeOrange]}>
            <Text style={styles.paidStatus}>
              {item.paid ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteExpense(item)}
      >
        <Ionicons name="trash-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Chưa có khoản chi tiêu nào.</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Danh sách chi tiêu</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={expenses.length === 0 ? styles.emptyList : undefined}
        />
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleCancelModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editMode ? 'Chỉnh sửa chi tiêu' : 'Thêm chi tiêu mới'}
              </Text>

              <Text style={styles.label}>
                Tiêu đề <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Cà phê"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <Text style={styles.label}>
                Số tiền <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: 30000"
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Danh mục (tùy chọn)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Ăn uống"
                value={newCategory}
                onChangeText={setNewCategory}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancelModal}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleAddExpense}
                >
                  <Text style={styles.saveButtonText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  expenseItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  expenseItem: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    marginLeft: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 8,
  },
  paidBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidBadgeGreen: {
    backgroundColor: '#d4edda',
  },
  paidBadgeOrange: {
    backgroundColor: '#fff3cd',
  },
  paidStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  paid: {
    color: '#27ae60',
  },
  unpaid: {
    color: '#f39c12',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
