const db = require("../db/knex");
const { v4: uuidv4 } = require('uuid');

// Status constants
const STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed'
};

module.exports = {
  STATUS,

  create(log) {
    const now = new Date();
    const event = {
      event_id: log.event_id || uuidv4(),
      received_timestamp: log.received_timestamp || now,
      created_at: now,
      updated_at: now,
      status: log.status || STATUS.PENDING,
      ...log
    };

    // Remove any duplicate fields that might have been added by the spread
    delete event.created_at;
    delete event.updated_at;
    
    return db("logs")
      .insert(event)
      .returning('*');
  },

  async count(filters = {}) {
    const query = db("logs").count('* as total');

    // Apply filters if provided
    if (filters.account_id) {
      query.where("logs.account_id", filters.account_id);
    }
    if (filters.destination_id) {
      query.where("logs.destination_id", filters.destination_id);
    }
    if (filters.status) {
      query.where("logs.status", filters.status);
    }
    if (filters.start_date) {
      query.where("logs.received_timestamp", ">=", filters.start_date);
    }
    if (filters.end_date) {
      query.where("logs.received_timestamp", "<=", filters.end_date);
    }

    const result = await query.first();
    return parseInt(result.total);
  },

  findAll(filters = {}, page = 1, limit = 10) {
    const query = db("logs")
      .select(
        "logs.*",
        "accounts.account_name as account_name",
        "destinations.url as destination_name"
      )
      .leftJoin("accounts", "logs.account_id", "accounts.account_id")
      .leftJoin("destinations", "logs.destination_id", "destinations.destination_id")
      .orderBy("received_timestamp", "desc");

    // Apply filters if provided
    if (filters.account_id) {
      query.where("logs.account_id", filters.account_id);
    }
    if (filters.destination_id) {
      query.where("logs.destination_id", filters.destination_id);
    }
    if (filters.status) {
      query.where("logs.status", filters.status);
    }
    if (filters.start_date) {
      query.where("logs.received_timestamp", ">=", filters.start_date);
    }
    if (filters.end_date) {
      query.where("logs.received_timestamp", "<=", filters.end_date);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    return query
      .limit(parseInt(limit))
      .offset(parseInt(offset));
  },

  findById(event_id) {
    return db("logs")
      .select(
        "logs.*",
        "accounts.account_name as account_name",
        "destinations.url as destination_name"
      )
      .leftJoin("accounts", "logs.account_id", "accounts.account_id")
      .leftJoin("destinations", "logs.destination_id", "destinations.destination_id")
      .where("logs.event_id", event_id)
      .first();
  },

  findByAccountId(account_id, filters = {}) {
    const query = db("logs")
      .where("logs.account_id", account_id)
      .select(
        "logs.*",
        "destinations.url as destination_name"
      )
      .leftJoin("destinations", "logs.destination_id", "destinations.destination_id")
      .orderBy("received_timestamp", "desc");

    if (filters.status) {
      query.where("logs.status", filters.status);
    }
    if (filters.start_date) {
      query.where("logs.received_timestamp", ">=", filters.start_date);
    }
    if (filters.end_date) {
      query.where("logs.received_timestamp", "<=", filters.end_date);
    }

    return query;
  },

  findByDestinationId(destination_id, filters = {}) {
    const query = db("logs")
      .where("logs.destination_id", destination_id)
      .select(
        "logs.*",
        "accounts.account_name as account_name"
      )
      .leftJoin("accounts", "logs.account_id", "accounts.account_id")
      .orderBy("received_timestamp", "desc");

    if (filters.status) {
      query.where("logs.status", filters.status);
    }
    if (filters.start_date) {
      query.where("logs.received_timestamp", ">=", filters.start_date);
    }
    if (filters.end_date) {
      query.where("logs.received_timestamp", "<=", filters.end_date);
    }

    return query;
  },

  async updateStatus(event_id, status, processed_timestamp = null) {
    try {
      const updates = {
        status,
        updated_at: db.fn.now()
      };
      
      if (processed_timestamp) {
        updates.processed_timestamp = processed_timestamp;
      } else if (status === STATUS.SUCCESS || status === STATUS.FAILED) {
        updates.processed_timestamp = db.fn.now();
      }

      const result = await db("logs")
        .where("event_id", event_id)
        .update(updates);

      if (result === 0) {
        throw new Error(`No log found with event_id: ${event_id}`);
      }

      return result;
    } catch (error) {
      console.error('Error updating log status:', {
        event_id,
        status,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  getStats(account_id = null, destination_id = null, timeframe = '24h') {
    const query = db("logs")
      .select(db.raw("COUNT(*) as total"))
      .select(db.raw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as success", [STATUS.SUCCESS]))
      .select(db.raw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed", [STATUS.FAILED]))
      .select(db.raw("SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending", [STATUS.PENDING]));

    if (account_id) {
      query.where("account_id", account_id);
    }
    if (destination_id) {
      query.where("destination_id", destination_id);
    }

    // Add timeframe filter
    const now = new Date();
    switch (timeframe) {
      case '1h':
        query.where("received_timestamp", ">=", new Date(now - 60 * 60 * 1000));
        break;
      case '24h':
        query.where("received_timestamp", ">=", new Date(now - 24 * 60 * 60 * 1000));
        break;
      case '7d':
        query.where("received_timestamp", ">=", new Date(now - 7 * 24 * 60 * 60 * 1000));
        break;
      case '30d':
        query.where("received_timestamp", ">=", new Date(now - 30 * 24 * 60 * 60 * 1000));
        break;
    }

    return query.first();
  }
}; 