import { db } from '../lib/db.js';

export class VocabModel {
  static getAll(filters = {}) {
    let result = [...db.vocabularies];
    if (filters.topic && filters.topic !== 'Tất cả') {
      result = result.filter(v => v.topic === filters.topic);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(v => v.word.toLowerCase().includes(q) || v.meaning.toLowerCase().includes(q));
    }
    return result;
  }

  static getById(id) {
    return db.vocabularies.find(v => v.id === id) || null;
  }

  static create(data) {
    const newVocab = {
      id: "voc-" + Date.now(),
      word: data.word,
      phonetic: data.phonetic || "",
      partOfSpeech: data.partOfSpeech || "noun",
      meaning: data.meaning,
      example: data.example || "",
      topic: data.topic || "Chung",
      isMastered: false
    };
    db.vocabularies.unshift(newVocab);
    return newVocab;
  }

  static toggleMastered(id) {
    const item = db.vocabularies.find(v => v.id === id);
    if (item) {
      item.isMastered = !item.isMastered;
      return item;
    }
    return null;
  }

  static delete(id) {
    const index = db.vocabularies.findIndex(v => v.id === id);
    if (index !== -1) {
      const removed = db.vocabularies.splice(index, 1);
      return removed[0];
    }
    return null;
  }
}
