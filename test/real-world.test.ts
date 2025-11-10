import { diff, apply, sortKeys } from '../src/index';

describe('Real-world Use Cases', () => {

  describe('Database operations', () => {
    it('should handle user profile updates', () => {
      const oldProfile = {
        id: 123,
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          preferences: {
            theme: 'light',
            notifications: true
          }
        },
        permissions: ['read', 'write']
      };

      const newProfile = {
        id: 123,
        email: 'john.doe@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Smith',
          preferences: {
            theme: 'dark',
            notifications: true,
            language: 'en'
          },
          avatar: 'profile.jpg'
        },
        permissions: ['read', 'write', 'admin']
      };

      const operations = diff(oldProfile, newProfile);
      const result = apply(oldProfile, operations);
      expect(sortKeys(result)).toEqual(sortKeys(newProfile));

      // Verify specific operations we expect
      expect(operations.some(op => op.path === '.email' && op.type === 'set')).toBe(true);
      expect(operations.some(op => op.path === '.profile.lastName' && op.type === 'set')).toBe(true);
      expect(operations.some(op => op.path === '.profile.preferences.theme' && op.type === 'set')).toBe(true);
    });

    it('should handle inventory updates', () => {
      const oldInventory = {
        warehouse: 'A',
        items: [
          { sku: 'ITEM001', quantity: 50, price: 19.99 },
          { sku: 'ITEM002', quantity: 0, price: 29.99 }
        ],
        lastUpdated: '2023-01-01'
      };

      const newInventory = {
        warehouse: 'A',
        items: [
          { sku: 'ITEM001', quantity: 45, price: 21.99 },
          { sku: 'ITEM002', quantity: 10, price: 29.99 },
          { sku: 'ITEM003', quantity: 25, price: 15.99 }
        ],
        lastUpdated: '2023-01-02'
      };

      const operations = diff(oldInventory, newInventory);
      const result = apply(oldInventory, operations);
      expect(sortKeys(result)).toEqual(sortKeys(newInventory));
    });
  });

  describe('Configuration management', () => {
    it('should handle application config changes', () => {
      const oldConfig = {
        app: {
          name: 'MyApp',
          version: '1.0.0',
          features: {
            authentication: true,
            analytics: false
          }
        },
        database: {
          host: 'localhost',
          port: 5432,
          ssl: false
        },
        logging: {
          level: 'info',
          destinations: ['console']
        }
      };

      const newConfig = {
        app: {
          name: 'MyApp',
          version: '1.1.0',
          features: {
            authentication: true,
            analytics: true,
            darkMode: true
          }
        },
        database: {
          host: 'prod-db.example.com',
          port: 5432,
          ssl: true,
          poolSize: 20
        },
        logging: {
          level: 'warn',
          destinations: ['console', 'file', 'remote']
        },
        cache: {
          enabled: true,
          ttl: 3600
        }
      };

      const operations = diff(oldConfig, newConfig);
      const result = apply(oldConfig, operations);
      expect(sortKeys(result)).toEqual(sortKeys(newConfig));
    });
  });

  describe('Form state tracking', () => {
    it('should track complex form changes', () => {
      const initialForm = {
        personalInfo: {
          name: '',
          email: '',
          phone: ''
        },
        address: {
          street: '',
          city: '',
          country: 'US'
        },
        preferences: [],
        agreedToTerms: false
      };

      const filledForm = {
        personalInfo: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '+1-555-0123'
        },
        address: {
          street: '123 Main St',
          city: 'San Francisco',
          country: 'US',
          zipCode: '94105'
        },
        preferences: ['newsletter', 'promotions'],
        agreedToTerms: true
      };

      const operations = diff(initialForm, filledForm);
      const result = apply(initialForm, operations);
      expect(sortKeys(result)).toEqual(sortKeys(filledForm));

      // Should track each field change
      expect(operations.length).toBeGreaterThan(6);
    });
  });

  describe('API response comparison', () => {
    it('should detect changes in API responses', () => {
      const oldResponse = {
        data: {
          users: [
            { id: 1, name: 'John', status: 'active', lastLogin: '2023-01-01' },
            { id: 2, name: 'Jane', status: 'inactive', lastLogin: '2022-12-15' }
          ],
          pagination: {
            page: 1,
            total: 2,
            hasMore: false
          }
        },
        meta: {
          timestamp: '2023-01-01T10:00:00Z',
          version: '1.0'
        }
      };

      const newResponse = {
        data: {
          users: [
            { id: 1, name: 'John Doe', status: 'active', lastLogin: '2023-01-02' },
            { id: 2, name: 'Jane', status: 'active', lastLogin: '2023-01-02' },
            { id: 3, name: 'Bob', status: 'active', lastLogin: '2023-01-01' }
          ],
          pagination: {
            page: 1,
            total: 3,
            hasMore: false
          }
        },
        meta: {
          timestamp: '2023-01-02T10:00:00Z',
          version: '1.0'
        }
      };

      const operations = diff(oldResponse, newResponse);
      const result = apply(oldResponse, operations);
      expect(sortKeys(result)).toEqual(sortKeys(newResponse));
    });
  });

});

