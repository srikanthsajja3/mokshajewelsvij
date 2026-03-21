import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  Platform 
} from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false
}) => {
  if (!visible && Platform.OS !== 'web') return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.confirmButton, 
                isDestructive ? styles.destructiveButton : styles.primaryButton
              ]} 
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.confirmButtonText,
                isDestructive ? styles.destructiveText : styles.primaryText
              ]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#3d2b1a',
    borderRadius: 12,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: 'TrajanPro',
    fontSize: 20,
    color: '#D4AF37',
    marginBottom: 15,
    textAlign: 'center',
    letterSpacing: 1,
  },
  message: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5a4028',
  },
  cancelButtonText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  destructiveButton: {
    backgroundColor: 'transparent',
    borderColor: '#ff4444',
  },
  confirmButtonText: {
    fontWeight: 'bold',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  primaryText: {
    color: '#000',
  },
  destructiveText: {
    color: '#ff4444',
  },
});

export default ConfirmationModal;
