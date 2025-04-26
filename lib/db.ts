// IndexedDB database implementation

const DB_NAME = "exercise-tracker"
const DB_VERSION = 1
const WORKOUT_STORE = "workout-data"
const FEEDBACK_STORE = "feedback-data"

let db: IDBDatabase | null = null

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(true)
      return
    }

    if (!window.indexedDB) {
      console.error("Your browser doesn't support IndexedDB")
      reject("IndexedDB not supported")
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("Database error:", (event.target as IDBRequest).error)
      reject((event.target as IDBRequest).error)
    }

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result
      resolve(true)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Create workout data store
      if (!database.objectStoreNames.contains(WORKOUT_STORE)) {
        database.createObjectStore(WORKOUT_STORE, { keyPath: "id" })
      }

      // Create feedback data store
      if (!database.objectStoreNames.contains(FEEDBACK_STORE)) {
        database.createObjectStore(FEEDBACK_STORE, { keyPath: "id" })
      }
    }
  })
}

export const saveWorkoutData = (data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    const transaction = db.transaction([WORKOUT_STORE], "readwrite")
    const store = transaction.objectStore(WORKOUT_STORE)

    // Always use the same ID to overwrite previous data
    const workoutData = {
      id: "current-workout",
      ...data,
    }

    const request = store.put(workoutData)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const getWorkoutData = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    const transaction = db.transaction([WORKOUT_STORE], "readonly")
    const store = transaction.objectStore(WORKOUT_STORE)
    const request = store.get("current-workout")

    request.onsuccess = () => {
      if (request.result) {
        // Return the data without the ID
        const { id, ...data } = request.result
        resolve(data)
      } else {
        resolve(null)
      }
    }

    request.onerror = () => reject(request.error)
  })
}

export const saveFeedback = (feedbackData: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    const transaction = db.transaction([FEEDBACK_STORE], "readwrite")
    const store = transaction.objectStore(FEEDBACK_STORE)

    // Always use the same ID to overwrite previous feedback
    const data = {
      id: "current-feedback",
      ...feedbackData,
    }

    const request = store.put(data)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export const getFeedback = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("Database not initialized")
      return
    }

    const transaction = db.transaction([FEEDBACK_STORE], "readonly")
    const store = transaction.objectStore(FEEDBACK_STORE)
    const request = store.get("current-feedback")

    request.onsuccess = () => {
      if (request.result) {
        // Return the feedback data without the ID
        const { id, ...data } = request.result
        resolve(data)
      } else {
        resolve({})
      }
    }

    request.onerror = () => reject(request.error)
  })
}
