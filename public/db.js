let db;

let budgetTrackerVersion;

// Create a new database request for a database
const request = indexedDB.open('budgetTrackerDB', 1);

request.onupgradedneeded = function (event) {
    console.log('IndexDB update needed');

    const { oldVersion } = event;
    const newVersion = event.newVersion || db.version;

    console.log(`Database version ${oldVersion} updated to version ${newVersion}`);

    db = event.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('BudgetTrack', { autoIncrement: true });
    }
};

request.onerror = function (event) {
    console.log(`Error: ${event.target.errorCode}`);
};

function checkDatabase() {
    console.log('check invoked database');

    // Open a transaction on BudgetTrack DB
    let transaction = db.transaction(['BudgetTrack'], 'readwrite');

    // access BudgetTrack object
    const store = transaction.objectStore('BudgetTrack');

    // Get all records from store and set as variable
    const getAll = store.getAll();

    // If request successful
    getAll.onsuccess = function () {
        // We will bulk add items from store if they exist once back online
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((res) => {
                    // If response not empty
                    if (res.length !== 0) {
                        // Open another transaction to our BudgetTrack being able to read and write
                        transaction = db.transaction(['BudgetTrack'], 'readwrite');

                        // Assign current instance of store to a variable
                        const currentStore = transaction.objectStore('BudgetTrack');

                        // Clear existing data due to successful bulk create
                        currentStore.clear();
                        console.log('Clearing Store Data');
                    }
                });
        }
    };
}

request.onsuccess = function (event) {
    console.log('Success');
    db = event.target.result;

    // Read from db after checking if app is online
    if (navigator.onLine) {
        checkDatabase();
    }
};

const saveRecord = (record) => {
    console.log('Record Saved!');

    const transaction = db.transaction(['BudgetTrack'], 'readwrite');

    const store = transaction.objectStore('BudgetTrack');

    // Add record to store
    store.add(record);
};

window.addEventListener('online', checkDatabase);