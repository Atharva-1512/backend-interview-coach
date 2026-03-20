export type Difficulty = "easy" | "medium" | "hard";

export type InterviewQuestion = {
  question: string;
  keywords: string[];
  idealAnswer: string;
  difficulty: Difficulty;
};

export const interviewQuestions: InterviewQuestion[] = [
  {
    difficulty: "easy",
    question: "What is a REST API, and what makes an API RESTful?",
    keywords: ["stateless", "http", "resources", "client-server", "cacheable", "uniform interface"],
    idealAnswer:
      "A REST API follows the REST architectural style. It models the system as resources identified by URLs and manipulated via standard HTTP methods (GET, POST, PUT/PATCH, DELETE). It is stateless (each request contains all context), uses a uniform interface, supports caching where appropriate, and follows a client-server separation. In practice, RESTful APIs use HTTP status codes, meaningful resource representations (often JSON), and consistent conventions.",
  },
  {
    difficulty: "easy",
    question: "Explain the difference between authentication and authorization.",
    keywords: ["identity", "who you are", "permissions", "what you can do", "tokens", "roles"],
    idealAnswer:
      "Authentication verifies identity (who the user/service is), while authorization determines permissions (what that authenticated identity is allowed to do). Authentication is commonly implemented with sessions or tokens (e.g., JWT/OAuth), and authorization is typically implemented with roles/permissions (RBAC/ABAC) and enforced at endpoints or in middleware/policies.",
  },
  {
    difficulty: "easy",
    question: "What are HTTP status codes 200, 201, 204, 400, 401, 403, 404, and 500 used for?",
    keywords: ["success", "created", "no content", "bad request", "unauthorized", "forbidden", "not found", "server error"],
    idealAnswer:
      "200 indicates a successful request returning content. 201 means a resource was created (often with Location header). 204 means success with no response body. 400 is a client error due to invalid input. 401 means unauthenticated (missing/invalid credentials). 403 means authenticated but not allowed. 404 indicates the resource doesn't exist. 500 is a generic server-side failure.",
  },
  {
    difficulty: "easy",
    question: "Explain the difference between synchronous and asynchronous processing in backend systems.",
    keywords: ["blocking", "non-blocking", "latency", "throughput", "queue", "event loop"],
    idealAnswer:
      "Synchronous processing blocks the caller until work completes, which can increase perceived latency and reduce throughput under slow operations. Asynchronous processing decouples work from the request/response path—often using queues or background workers—improving responsiveness and scalability. The trade-off is added complexity: eventual consistency, retries, ordering, and observability.",
  },
  {
    difficulty: "medium",
    question: "What is database indexing and what trade-offs does it introduce?",
    keywords: ["b-tree", "faster reads", "write overhead", "storage", "selectivity", "query plan"],
    idealAnswer:
      "An index is a data structure (commonly B-Tree) that speeds up reads by allowing the database to locate rows without scanning the entire table. Trade-offs include extra storage, slower writes/updates (because indexes must be maintained), and potential performance issues if indexes are poorly chosen (low selectivity, too many indexes). Proper indexing depends on query patterns and the optimizer's query plan.",
  },
  {
    difficulty: "medium",
    question: "What is a transaction and what do ACID properties mean?",
    keywords: ["atomicity", "consistency", "isolation", "durability", "commit", "rollback"],
    idealAnswer:
      "A transaction groups operations into a single unit of work. ACID means: Atomicity (all-or-nothing), Consistency (constraints remain valid), Isolation (concurrent transactions don't interfere beyond the chosen isolation level), and Durability (committed changes persist). Transactions commit on success and rollback on failure to keep data correct under errors and concurrency.",
  },
  {
    difficulty: "medium",
    question: "What's the difference between SQL and NoSQL databases, and when would you choose each?",
    keywords: ["schema", "joins", "consistency", "scalability", "document", "key-value"],
    idealAnswer:
      "SQL databases are relational, typically schema-based, and excel at joins and strong consistency with complex queries. NoSQL databases (document, key-value, column, graph) often trade some relational features for flexible schema and horizontal scalability. Choose SQL for relational integrity and complex querying; choose NoSQL when flexible data models, high write throughput, or large-scale distribution patterns are more important.",
  },
  {
    difficulty: "medium",
    question: "Explain caching strategies and common cache invalidation approaches.",
    keywords: ["ttl", "cache-aside", "write-through", "write-back", "invalidation", "stale"],
    idealAnswer:
      "Common strategies include cache-aside (app reads from cache, falls back to DB, then populates), write-through (writes go to cache and DB synchronously), and write-back (writes go to cache first then DB asynchronously). Invalidation approaches include TTL-based expiry, explicit invalidation on writes, and versioning. Trade-offs involve consistency vs performance and the risk of serving stale data.",
  },
  {
    difficulty: "medium",
    question: "What is an idempotent API operation and why does it matter?",
    keywords: ["safe retries", "same result", "network failures", "PUT", "DELETE", "idempotency key"],
    idealAnswer:
      "An idempotent operation can be executed multiple times with the same effect as a single execution (same final state). This matters for safe retries during network failures and timeouts. HTTP PUT and DELETE are intended to be idempotent, while POST is not by default—though you can add idempotency keys to make repeated POST requests safe.",
  },
  {
    difficulty: "medium",
    question: "What is the N+1 query problem and how do you avoid it?",
    keywords: ["orm", "eager loading", "join", "batch", "preload", "query count"],
    idealAnswer:
      "The N+1 problem happens when an initial query loads a list (1 query) and then each item triggers another query (N queries). It's common with ORMs and lazy loading. Avoid it via eager loading/preloading, joins, batching (IN queries), or restructuring the data access layer to reduce query count and leverage indexes.",
  },
  {
    difficulty: "hard",
    question: "How do you handle rate limiting in backend systems?",
    keywords: ["token bucket", "leaky bucket", "sliding window", "429", "fairness", "distributed"],
    idealAnswer:
      "Rate limiting protects services from abuse and overload. Common algorithms include token bucket, leaky bucket, and sliding window counters. Systems typically return HTTP 429 with headers for retry timing. In distributed systems, limits often use centralized/shared state (Redis) or consistent hashing, and must consider fairness per user/IP/API key and burst behavior.",
  },
  {
    difficulty: "hard",
    question: "What is a message queue and what problems does it solve?",
    keywords: ["decouple", "buffer", "retry", "backpressure", "at-least-once", "consumer"],
    idealAnswer:
      "A message queue decouples producers from consumers by buffering work. It helps with load leveling, backpressure, retries, and asynchronous processing. Delivery semantics (at-most-once, at-least-once, exactly-once-ish) affect how consumers handle duplicates and idempotency. It improves resilience and scalability at the cost of operational and design complexity.",
  },
  {
    difficulty: "hard",
    question: "What is a load balancer and what are common balancing strategies?",
    keywords: ["round robin", "least connections", "health checks", "sticky sessions", "layer 4", "layer 7"],
    idealAnswer:
      "A load balancer distributes traffic across instances to improve availability and performance. Common strategies include round robin, least connections, and weighted balancing. It performs health checks to remove unhealthy targets. Some setups use sticky sessions, though stateless services are preferred. Load balancers can operate at Layer 4 (TCP) or Layer 7 (HTTP) with smarter routing.",
  },
  {
    difficulty: "hard",
    question: "Explain optimistic vs pessimistic locking.",
    keywords: ["version", "conflict", "concurrency", "lock", "retry", "deadlock"],
    idealAnswer:
      "Optimistic locking assumes conflicts are rare; it uses a version field or timestamp and fails the write if the version changed, requiring a retry. Pessimistic locking prevents conflicts by locking rows/resources before updates, reducing conflicts but increasing contention and the risk of deadlocks. Choice depends on conflict rate and latency requirements.",
  },
];