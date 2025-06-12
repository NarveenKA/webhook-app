const db = require("../db/knex");
const { v4: uuidv4 } = require('uuid');

// Status constants
const STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
};

module.exports = {
  STATUS,

  create(log) {
    const now = new Date();
    const event = {
      event_id: uuidv4(),
      received_timestamp: now,
      created_at: now,
      updated_at: now,
      status: STATUS.PENDING,
      ...log
    };
    return db("logs").insert(event).returning('event_id');
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
    return query.limit(limit).offset(offset);
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
      .where({ event_id })
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
    const updates = {
      status,
      updated_at: db.fn.now()
    };
    
    if (processed_timestamp) {
      updates.processed_timestamp = processed_timestamp;
    } else if (status === STATUS.SUCCESS || status === STATUS.FAILED) {
      updates.processed_timestamp = db.fn.now();
    }

    return db("logs")
      .where({ event_id })
      .update(updates);
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