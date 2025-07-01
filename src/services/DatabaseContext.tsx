import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';
import { DatabaseContextType, ClothingItem, Outfit, ShoppingItem } from '../types';

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
  user_id: number;
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

  useEffect(() => {
    initDatabase();
  }, []);

  const initDatabase = async (): Promise<void> => {
    try {
      const database = await SQLite.openDatabaseAsync('wardrobe.db');
      
      // 创建表
      await createTables(database);
      
      setDb(database);
      setIsLoading(false);
      
      // 初始化数据
      await refreshData();
    } catch (error) {
      console.error('Database initialization error:', error);
      setIsLoading(false);
    }
  };

  const createTables = async (database: SQLite.SQLiteDatabase): Promise<void> => {
    try {
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
          clothingIds TEXT NOT NULL,
          date TEXT NOT NULL,
          occasion TEXT,
          weather TEXT,
          imageUri TEXT,
          notes TEXT,
          rating INTEGER,
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

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Create tables error:', error);
      throw error;
    }
  };

  const refreshData = async (): Promise<void> => {
    if (!db) return;
    
    try {
      // 获取衣物数据
      const clothingResult = await db.getAllAsync('SELECT * FROM clothing ORDER BY updatedAt DESC');
      const clothingItems: ClothingItem[] = clothingResult.map((item: any) => ({
        ...item,
        tags: item.tags ? JSON.parse(item.tags) : [],
        isVisible: Boolean(item.isVisible),
      }));
      setClothing(clothingItems);

      // 获取穿搭数据
      const outfitsResult = await db.getAllAsync('SELECT * FROM outfits ORDER BY updatedAt DESC');
      const outfitItems: Outfit[] = outfitsResult.map((item: any) => ({
        ...item,
        clothingIds: item.clothingIds ? JSON.parse(item.clothingIds) : [],
        isVisible: Boolean(item.isVisible),
      }));
      setOutfits(outfitItems);

      // 获取购物清单数据
      const shoppingResult = await db.getAllAsync('SELECT * FROM shopping_items ORDER BY updatedAt DESC');
      const shoppingItems: ShoppingItem[] = shoppingResult.map((item: any) => ({
        ...item,
        isCompleted: Boolean(item.isCompleted),
      }));
      setShoppingList(shoppingItems);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // 衣物操作
  const addClothing = async (item: Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const clothingItem: ClothingItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    };

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
        (id, name, clothingIds, date, occasion, weather, imageUri, notes, rating, isVisible, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          outfitItem.id,
          outfitItem.name,
          JSON.stringify(outfitItem.clothingIds),
          outfitItem.date,
          outfitItem.occasion || null,
          outfitItem.weather || null,
          outfitItem.imageUri || null,
          outfitItem.notes || null,
          outfitItem.rating || null,
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

  const value: DatabaseContextType = {
    clothing,
    outfits,
    shoppingList,
    addClothing,
    updateClothing,
    deleteClothing,
    addOutfit,
    updateOutfit,
    deleteOutfit,
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    initializeDatabase: initDatabase,
    refreshData,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}; 