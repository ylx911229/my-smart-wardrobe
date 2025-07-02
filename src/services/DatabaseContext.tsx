import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';
import { DatabaseContextType, ClothingItem, Outfit, ShoppingItem, User } from '../types';

// 数据库操作的参数类型
interface ClothingData {
  name: string;
  category_id: number;
  photo_uri: string;
  brand?: string;
  color?: string;
  size?: string;
  purchase_date?: string;
  purchase_price?: number;
  purchase_link?: string;
  location?: string;
  notes?: string;
}

interface OutfitData {
  name?: string;
  user_id: string;
  photo_uri?: string;
  occasion?: string;
  weather?: string;
  notes?: string;
}

interface DatabaseContextProps {
  children: ReactNode;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<DatabaseContextProps> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clothing, setClothing] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async (): Promise<void> => {
    try {
      console.log('Initializing database...');
      const database = await SQLite.openDatabaseAsync('wardrobe.db');
      
      // 创建表和执行迁移
      await createTables(database);
      
      setDb(database);
      console.log('Database initialized successfully');
      
      // 迁移完成后直接使用database实例刷新数据
      await refreshDataWithDatabase(database);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Database initialization error:', error);
      setIsLoading(false);
    }
  };

  const createTables = async (database: SQLite.SQLiteDatabase): Promise<void> => {
    try {
      // 检查用户表是否存在且结构正确
      let shouldRecreateUsersTable = false;
      try {
        const tableInfo = await database.getAllAsync(`PRAGMA table_info(users)`);
        // 检查是否缺少必要的列
        const requiredColumns = ['id', 'name', 'photo_uri', 'isDefault', 'createdAt', 'updatedAt'];
        const existingColumns = tableInfo.map((col: any) => col.name);
        const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
        
        if (missingColumns.length > 0) {
          console.log('Users table structure is incomplete, missing columns:', missingColumns);
          shouldRecreateUsersTable = true;
        }
      } catch (error) {
        // 表不存在
        console.log('Users table does not exist, will create it');
        shouldRecreateUsersTable = true;
      }

      // 只有在必要时才删除并重建用户表
      if (shouldRecreateUsersTable) {
        console.log('Recreating users table...');
        await database.execAsync(`DROP TABLE IF EXISTS users;`);
        
        await database.execAsync(`
          CREATE TABLE users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            photo_uri TEXT,
            isDefault INTEGER DEFAULT 0,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );
        `);
        console.log('Users table recreated successfully');
      } else {
        console.log('Users table already exists with correct structure');
      }

      // 衣物表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS clothing (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          color TEXT NOT NULL,
          brand TEXT,
          price REAL,
          purchaseDate TEXT,
          imageUri TEXT,
          tags TEXT,
          season TEXT NOT NULL,
          material TEXT,
          size TEXT,
          isVisible INTEGER DEFAULT 1,
          notes TEXT,
          lastWorn TEXT,
          wearCount INTEGER DEFAULT 0,
          rating INTEGER,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // 穿搭表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS outfits (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          user_id TEXT,
          clothingIds TEXT NOT NULL,
          date TEXT NOT NULL,
          occasion TEXT,
          weather TEXT,
          imageUri TEXT,
          notes TEXT,
          rating INTEGER,
          is_favorite INTEGER DEFAULT 0,
          isVisible INTEGER DEFAULT 1,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // 购物清单表
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS shopping_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          priority TEXT NOT NULL,
          estimatedPrice REAL,
          notes TEXT,
          isCompleted INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // 执行数据库迁移
      await migrateDatabase(database);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Create tables error:', error);
      throw error;
    }
  };

  const migrateDatabase = async (database: SQLite.SQLiteDatabase): Promise<void> => {
    try {
      console.log('Starting database migration...');
      
      // 检查并添加缺失的列
      const currentTime = new Date().toISOString();
      
      // 跳过users表的迁移，因为我们已经重新创建了
      
      // 为clothing表添加缺失的列
      await addColumnIfNotExists(database, 'clothing', 'createdAt', `TEXT NOT NULL DEFAULT '${currentTime}'`);
      await addColumnIfNotExists(database, 'clothing', 'updatedAt', `TEXT NOT NULL DEFAULT '${currentTime}'`);
      await addColumnIfNotExists(database, 'clothing', 'tags', `TEXT DEFAULT '[]'`);
      await addColumnIfNotExists(database, 'clothing', 'season', `TEXT DEFAULT '全季'`);
      await addColumnIfNotExists(database, 'clothing', 'wearCount', `INTEGER DEFAULT 0`);
      await addColumnIfNotExists(database, 'clothing', 'isVisible', `INTEGER DEFAULT 1`);
      await addColumnIfNotExists(database, 'clothing', 'imageUri', `TEXT`);
      await addColumnIfNotExists(database, 'clothing', 'lastWorn', `TEXT`);
      await addColumnIfNotExists(database, 'clothing', 'rating', `INTEGER`);
      await addColumnIfNotExists(database, 'clothing', 'material', `TEXT`);
      await addColumnIfNotExists(database, 'clothing', 'notes', `TEXT`);
      await addColumnIfNotExists(database, 'clothing', 'brand', `TEXT`);
      await addColumnIfNotExists(database, 'clothing', 'price', `REAL`);
      await addColumnIfNotExists(database, 'clothing', 'purchaseDate', `TEXT`);
      await addColumnIfNotExists(database, 'clothing', 'size', `TEXT`);
      
      // 为outfits表添加缺失的列
      await addColumnIfNotExists(database, 'outfits', 'createdAt', `TEXT NOT NULL DEFAULT '${currentTime}'`);
      await addColumnIfNotExists(database, 'outfits', 'updatedAt', `TEXT NOT NULL DEFAULT '${currentTime}'`);
      await addColumnIfNotExists(database, 'outfits', 'user_id', `TEXT`);
      await addColumnIfNotExists(database, 'outfits', 'clothingIds', `TEXT NOT NULL DEFAULT '[]'`);
      await addColumnIfNotExists(database, 'outfits', 'date', `TEXT NOT NULL DEFAULT '${currentTime}'`);
      await addColumnIfNotExists(database, 'outfits', 'isVisible', `INTEGER DEFAULT 1`);
      await addColumnIfNotExists(database, 'outfits', 'imageUri', `TEXT`);
      await addColumnIfNotExists(database, 'outfits', 'rating', `INTEGER`);
      await addColumnIfNotExists(database, 'outfits', 'occasion', `TEXT`);
      await addColumnIfNotExists(database, 'outfits', 'weather', `TEXT`);
      await addColumnIfNotExists(database, 'outfits', 'notes', `TEXT`);
      await addColumnIfNotExists(database, 'outfits', 'is_favorite', `INTEGER DEFAULT 0`);
      
      // 为shopping_items表添加缺失的列
      await addColumnIfNotExists(database, 'shopping_items', 'createdAt', `TEXT NOT NULL DEFAULT '${currentTime}'`);
      await addColumnIfNotExists(database, 'shopping_items', 'updatedAt', `TEXT NOT NULL DEFAULT '${currentTime}'`);
      await addColumnIfNotExists(database, 'shopping_items', 'isCompleted', `INTEGER DEFAULT 0`);
      
      // 初始化默认用户
      await initDefaultUser(database);
      
      console.log('Database migration completed successfully');
    } catch (error) {
      console.error('Database migration error:', error);
      // 不抛出错误，允许应用继续运行
    }
  };

  // 初始化默认用户
  const initDefaultUser = async (database: SQLite.SQLiteDatabase): Promise<void> => {
    try {
      const existingUsers = await database.getAllAsync(`SELECT * FROM users WHERE isDefault = 1`);
      if (existingUsers.length === 0) {
        const currentTime = new Date().toISOString();
        await database.runAsync(
          `INSERT INTO users (id, name, photo_uri, isDefault, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          ['default-user', '我', '', 1, currentTime, currentTime]
        );
        console.log('Default user created');
      }
    } catch (error) {
      console.error('Error initializing default user:', error);
    }
  };

  const addColumnIfNotExists = async (
    database: SQLite.SQLiteDatabase, 
    tableName: string, 
    columnName: string, 
    columnDefinition: string
  ): Promise<void> => {
    try {
      // 检查列是否存在
      const tableInfo = await database.getAllAsync(`PRAGMA table_info(${tableName})`);
      const columnExists = tableInfo.some((column: any) => column.name === columnName);
      
      if (!columnExists) {
        console.log(`Adding column ${columnName} to table ${tableName}`);
        await database.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      }
    } catch (error) {
      console.error(`Error adding column ${columnName} to table ${tableName}:`, error);
    }
  };

  const refreshDataWithDatabase = async (database: SQLite.SQLiteDatabase): Promise<void> => {
    try {
      console.log('Refreshing data...');
      
      // 加载用户数据
      const userRows = await database.getAllAsync(`SELECT * FROM users ORDER BY isDefault DESC, createdAt ASC`);
      console.log('Raw user data from database:', userRows);
      
      const usersData = userRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        photo_uri: row.photo_uri || '',
        isDefault: row.isDefault === 1,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
      setUsers(usersData);
      console.log('Processed users data:', usersData);
      
      // 加载衣物数据
      const clothingRows = await database.getAllAsync(`SELECT * FROM clothing WHERE isVisible = 1 ORDER BY createdAt DESC`);
      const clothingData = clothingRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        color: row.color,
        brand: row.brand || '',
        price: row.price || 0,
        purchaseDate: row.purchaseDate || '',
        imageUri: row.imageUri || '',
        tags: JSON.parse(row.tags || '[]'),
        season: row.season || '全季',
        material: row.material || '',
        size: row.size || '',
        isVisible: row.isVisible === 1,
        notes: row.notes || '',
        lastWorn: row.lastWorn || '',
        wearCount: row.wearCount || 0,
        rating: row.rating || 0,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
      setClothing(clothingData);

      // 加载穿搭数据
      const outfitRows = await database.getAllAsync(`SELECT * FROM outfits WHERE isVisible = 1 ORDER BY createdAt DESC`);
      const outfitData = outfitRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        user_id: row.user_id,
        clothingIds: JSON.parse(row.clothingIds || '[]'),
        date: row.date,
        occasion: row.occasion || '',
        weather: row.weather || '',
        imageUri: row.imageUri || '',
        notes: row.notes || '',
        rating: row.rating || 0,
        is_favorite: row.is_favorite === 1,
        isVisible: row.isVisible === 1,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
      setOutfits(outfitData);

      // 加载购物清单数据
      const shoppingRows = await database.getAllAsync(`SELECT * FROM shopping_items ORDER BY createdAt DESC`);
      const shoppingData = shoppingRows.map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        priority: row.priority as 'high' | 'medium' | 'low',
        estimatedPrice: row.estimatedPrice || 0,
        notes: row.notes || '',
        isCompleted: row.isCompleted === 1,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
      setShoppingList(shoppingData);

      console.log(`Data loaded: ${clothingData.length} clothing items, ${outfitData.length} outfits, ${shoppingData.length} shopping items, ${usersData.length} users`);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const refreshData = async (): Promise<void> => {
    if (!db) {
      console.warn('Database not initialized');
      return;
    }
    await refreshDataWithDatabase(db);
  };

  // 衣物操作
  const addClothing = async (item: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    
    // 确保图片字段正确映射
    const imageUri = item.imageUri || item.photo_uri || '';
    
    const clothingItem: ClothingItem = {
      ...item,
      id,
      imageUri, // 统一使用imageUri字段
      createdAt: now,
      updatedAt: now,
    };

    console.log('Adding clothing item:', {
      id,
      name: clothingItem.name,
      imageUri: clothingItem.imageUri,
      photo_uri: item.photo_uri
    });

    try {
      await db.runAsync(
        `INSERT INTO clothing 
        (id, name, category, color, brand, price, purchaseDate, imageUri, tags, 
         season, material, size, isVisible, notes, lastWorn, wearCount, rating, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clothingItem.id,
          clothingItem.name,
          clothingItem.category,
          clothingItem.color,
          clothingItem.brand || null,
          clothingItem.price || null,
          clothingItem.purchaseDate || null,
          clothingItem.imageUri || null,
          JSON.stringify(clothingItem.tags),
          clothingItem.season,
          clothingItem.material || null,
          clothingItem.size || null,
          clothingItem.isVisible ? 1 : 0,
          clothingItem.notes || null,
          clothingItem.lastWorn || null,
          clothingItem.wearCount,
          clothingItem.rating || null,
          clothingItem.createdAt,
          clothingItem.updatedAt
        ]
      );
      
      console.log('Clothing item added successfully, refreshing data...');
      await refreshData();
    } catch (error) {
      console.error('Error adding clothing:', error);
      throw error;
    }
  };

  const updateClothing = async (id: string, updates: Partial<ClothingItem>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const updateFields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`).join(', ');
    const updateValues = Object.entries(updates)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => {
        if (key === 'tags') return JSON.stringify(value);
        if (key === 'isVisible') return value ? 1 : 0;
        return value ?? null;
      }) as (string | number | null)[];

    try {
      await db.runAsync(
        `UPDATE clothing SET ${updateFields}, updatedAt = ? WHERE id = ?`,
        [...updateValues, now, id] as (string | number | null)[]
      );
      await refreshData();
    } catch (error) {
      console.error('Error updating clothing:', error);
      throw error;
    }
  };

  const deleteClothing = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      await db.runAsync('DELETE FROM clothing WHERE id = ?', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting clothing:', error);
      throw error;
    }
  };

  // 穿搭操作
  const addOutfit = async (outfit: Omit<Outfit, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const outfitItem: Outfit = {
      ...outfit,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.runAsync(
        `INSERT INTO outfits 
        (id, name, user_id, clothingIds, date, occasion, weather, imageUri, notes, rating, is_favorite, isVisible, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          outfitItem.id,
          outfitItem.name,
          outfitItem.user_id || null,
          JSON.stringify(outfitItem.clothingIds),
          outfitItem.date,
          outfitItem.occasion || null,
          outfitItem.weather || null,
          outfitItem.imageUri || outfitItem.photo_uri || null,
          outfitItem.notes || null,
          outfitItem.rating || null,
          outfitItem.is_favorite ? 1 : 0,
          outfitItem.isVisible ? 1 : 0,
          outfitItem.createdAt,
          outfitItem.updatedAt
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding outfit:', error);
      throw error;
    }
  };

  const updateOutfit = async (id: string, updates: Partial<Outfit>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const updateFields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`).join(', ');
    const updateValues = Object.entries(updates)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => {
        if (key === 'clothingIds') return JSON.stringify(value);
        if (key === 'isVisible') return value ? 1 : 0;
        if (key === 'is_favorite') return value ? 1 : 0;
        return value ?? null;
      }) as (string | number | null)[];

    try {
      await db.runAsync(
        `UPDATE outfits SET ${updateFields}, updatedAt = ? WHERE id = ?`,
        [...updateValues, now, id] as (string | number | null)[]
      );
      await refreshData();
    } catch (error) {
      console.error('Error updating outfit:', error);
      throw error;
    }
  };

  const deleteOutfit = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      await db.runAsync('DELETE FROM outfits WHERE id = ?', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting outfit:', error);
      throw error;
    }
  };

  // 购物清单操作
  const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const shoppingItem: ShoppingItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.runAsync(
        `INSERT INTO shopping_items 
        (id, name, category, priority, estimatedPrice, notes, isCompleted, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shoppingItem.id,
          shoppingItem.name,
          shoppingItem.category,
          shoppingItem.priority,
          shoppingItem.estimatedPrice || null,
          shoppingItem.notes || null,
          shoppingItem.isCompleted ? 1 : 0,
          shoppingItem.createdAt,
          shoppingItem.updatedAt
        ]
      );
      await refreshData();
    } catch (error) {
      console.error('Error adding shopping item:', error);
      throw error;
    }
  };

  const updateShoppingItem = async (id: string, updates: Partial<ShoppingItem>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const updateFields = Object.keys(updates).filter(key => key !== 'id').map(key => `${key} = ?`).join(', ');
    const updateValues = Object.entries(updates)
      .filter(([key]) => key !== 'id')
      .map(([key, value]) => {
        if (key === 'isCompleted') return value ? 1 : 0;
        return value ?? null;
      }) as (string | number | null)[];

    try {
      await db.runAsync(
        `UPDATE shopping_items SET ${updateFields}, updatedAt = ? WHERE id = ?`,
        [...updateValues, now, id] as (string | number | null)[]
      );
      await refreshData();
    } catch (error) {
      console.error('Error updating shopping item:', error);
      throw error;
    }
  };

  const deleteShoppingItem = async (id: string): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    try {
      await db.runAsync('DELETE FROM shopping_items WHERE id = ?', [id]);
      await refreshData();
    } catch (error) {
      console.error('Error deleting shopping item:', error);
      throw error;
    }
  };

  // 用户相关操作
  const addUser = async (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const currentTime = new Date().toISOString();
      
      console.log('Adding user:', { id, name: user.name, photo_uri: user.photo_uri });
      
      await db.runAsync(
        `INSERT INTO users (id, name, photo_uri, isDefault, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, user.name, user.photo_uri || '', 0, currentTime, currentTime]
      );

      console.log('User inserted successfully, refreshing data...');
      
      // 刷新用户数据
      await refreshData();
      console.log('User added successfully');
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      const currentTime = new Date().toISOString();
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.photo_uri !== undefined) {
        updateFields.push('photo_uri = ?');
        updateValues.push(updates.photo_uri);
      }

      updateFields.push('updatedAt = ?');
      updateValues.push(currentTime);
      updateValues.push(id);

      await db.runAsync(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      await refreshData();
      console.log('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    try {
      // 不允许删除默认用户
      const user = users.find(u => u.id === id);
      if (user?.isDefault) {
        throw new Error('Cannot delete default user');
      }

      await db.runAsync('DELETE FROM users WHERE id = ? AND isDefault = 0', [id]);
      await refreshData();
      console.log('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const value: DatabaseContextType = {
    isLoading,
    clothing,
    outfits,
    shoppingList,
    users,
    refreshData,
    addClothing,
    updateClothing,
    deleteClothing,
    addOutfit,
    updateOutfit,
    deleteOutfit,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    addUser,
    updateUser,
    deleteUser,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}; 