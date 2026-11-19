import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { setLanguage, type AppLanguage } from '../store/preferencesSlice';
import type { AppDispatch } from '../store';
import { useAppLanguage } from '../i18n';

const languageNames: Record<AppLanguage, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

export default function LanguageSelector() {
  const dispatch = useDispatch<AppDispatch>();
  const language = useAppLanguage();
  const [isOpen, setIsOpen] = useState(false);

  function chooseLanguage(nextLanguage: AppLanguage) {
    dispatch(setLanguage(nextLanguage));
    setIsOpen(false);
  }

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Language: ${languageNames[language]}`}
      >
        <Text style={styles.triggerText}>{language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={isOpen}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Close language menu"
          />
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>Chọn ngôn ngữ / Choose language</Text>
            {(['vi', 'en'] as const).map((option) => (
              <Pressable
                key={option}
                style={[styles.option, option === language && styles.optionSelected]}
                onPress={() => chooseLanguage(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: option === language }}
              >
                <Text style={[styles.optionText, option === language && styles.optionTextSelected]}>
                  {languageNames[option]}
                </Text>
                {option === language && <Text style={styles.check}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1EAF1',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    gap: 7,
  },
  triggerText: { color: '#344054', fontSize: 13, fontWeight: '700' },
  chevron: { color: '#687F91', fontSize: 15 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 40, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  menu: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 18,
    elevation: 8,
  },
  menuTitle: { color: '#344054', fontSize: 16, fontWeight: '800', marginBottom: 10 },
  option: {
    minHeight: 46,
    borderRadius: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: { backgroundColor: '#F6FDF7' },
  optionText: { color: '#344054', fontSize: 14 },
  optionTextSelected: { color: '#039855', fontWeight: '700' },
  check: { color: '#039855', fontSize: 18, fontWeight: '800' },
});
