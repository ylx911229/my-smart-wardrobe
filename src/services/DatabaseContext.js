import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

const DatabaseContext = createContext();

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider = ({ children }) => {
  const [db, setDb] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async () => {
    try {
      const database = await SQLite.openDatabaseAsync('wardrobe.db');
      
      // 创建表
      await createTables(database);
      
      setDb(database);
      setIsLoading(false);
    } catch (error) {
      console.error('Database initialization error:', error);
      setIsLoading(false);
    }
  };

  const createTables = async (database) => {
    try {
      // 用户表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          photo_uri TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 衣物分类表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          icon TEXT,
          color TEXT
        );
      `);

      // 衣物表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS clothes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER,
          photo_uri TEXT NOT NULL,
          brand TEXT,
          color TEXT,
          size TEXT,
          purchase_date DATE,
          purchase_price DECIMAL(10,2),
          purchase_link TEXT,
          location TEXT,
          notes TEXT,
          activity_score INTEGER DEFAULT 0,
          last_worn_date DATE,
          wear_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );
      `);

      // 穿搭表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS outfits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          user_id INTEGER,
          photo_uri TEXT,
          occasion TEXT,
          weather TEXT,
          notes TEXT,
          is_favorite BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
      `);

      // 穿搭-衣物关联表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS outfit_clothes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          outfit_id INTEGER,
          clothing_id INTEGER,
          FOREIGN KEY (outfit_id) REFERENCES outfits (id),
          FOREIGN KEY (clothing_id) REFERENCES clothes (id)
        );
      `);

      // 穿搭记录表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS wear_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          outfit_id INTEGER,
          user_id INTEGER,
          wear_date DATE DEFAULT CURRENT_DATE,
          weather TEXT,
          notes TEXT,
          FOREIGN KEY (outfit_id) REFERENCES outfits (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
      `);

      // 插入默认分类
      await database.execAsync(`
        INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES 
        (1, '上衣', 'shirt-outline', '#FF6B6B'),
        (2, '裤子', 'hardware-chip-outline', '#4ECDC4'),
        (3, '裙子', 'triangle-outline', '#45B7D1'),
        (4, '外套', 'jacket-outline', '#96CEB4'),
        (5, '鞋子', 'footsteps-outline', '#FFEAA7'),
        (6, '配饰', 'diamond-outline', '#DDA0DD'),
        (7, '包包', 'bag-outline', '#F39C12'),
        (8, '内衣', 'heart-outline', '#FFB6C1');
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Create tables error:', error);
      throw error;
    }
  };

  // 数据库操作方法
  const dbOperations = {
    // 用户操作
    addUser: async (name, photoUri) => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await db.runAsync(
          'INSERT INTO users (name, photo_uri) VALUES (?, ?)',
          [name, photoUri]
        );
        return result.lastInsertRowId;
      } catch (error) {
        throw error;
      }
    },

    getUsers: async () => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await db.getAllAsync(
          'SELECT * FROM users ORDER BY created_at DESC'
        );
        return result;
      } catch (error) {
        throw error;
      }
    },

    // 衣物操作
    addClothing: async (clothingData) => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await db.runAsync(
          `INSERT INTO clothes 
          (name, category_id, photo_uri, brand, color, size, purchase_date, 
           purchase_price, purchase_link, location, notes) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            clothingData.name,
            clothingData.category_id,
            clothingData.photo_uri,
            clothingData.brand,
            clothingData.color,
            clothingData.size,
            clothingData.purchase_date,
            clothingData.purchase_price,
            clothingData.purchase_link,
            clothingData.location,
            clothingData.notes
          ]
        );
        return result.lastInsertRowId;
      } catch (error) {
        throw error;
      }
    },

    getClothes: async (sortBy = 'activity_score DESC') => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await db.getAllAsync(
          `SELECT c.*, cat.name as category_name, cat.color as category_color 
           FROM clothes c 
           LEFT JOIN categories cat ON c.category_id = cat.id 
           ORDER BY ${sortBy}`
        );
        return result;
      } catch (error) {
        throw error;
      }
    },

    updateClothingActivity: async (clothingId, activityDelta = 1) => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await db.runAsync(
          'UPDATE clothes SET activity_score = activity_score + ?, last_worn_date = CURRENT_DATE WHERE id = ?',
          [activityDelta, clothingId]
        );
        return result;
      } catch (error) {
        throw error;
      }
    },

    // 穿搭操作
    addOutfit: async (outfitData, clothingIds) => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      try {
        // 首先插入穿搭
        const outfitResult = await db.runAsync(
          'INSERT INTO outfits (name, user_id, photo_uri, occasion, weather, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [outfitData.name, outfitData.user_id, outfitData.photo_uri, outfitData.occasion, outfitData.weather, outfitData.notes]
        );
        
        const outfitId = outfitResult.lastInsertRowId;
        
        // 然后插入穿搭-衣物关联
        for (const clothingId of clothingIds) {
          await db.runAsync(
            'INSERT INTO outfit_clothes (outfit_id, clothing_id) VALUES (?, ?)',
            [outfitId, clothingId]
          );
        }
        
        return outfitId;
      } catch (error) {
        throw error;
      }
    },

    getOutfits: async () => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await db.getAllAsync(
          `SELECT o.*, u.name as user_name 
           FROM outfits o 
           LEFT JOIN users u ON o.user_id = u.id 
           ORDER BY o.created_at DESC`
        );
        return result;
      } catch (error) {
        throw error;
      }
    },

    // 获取分类
    getCategories: async () => {
      if (!db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await db.getAllAsync(
          'SELECT * FROM categories ORDER BY id'
        );
        return result;
      } catch (error) {
        throw error;
      }
    }
  };

  const value = {
    db,
    isLoading,
    ...dbOperations
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}; 