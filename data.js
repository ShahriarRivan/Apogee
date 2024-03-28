import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
import { remove } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";//added this for login=============================================================
import { setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";
import { signOut } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";
import { get} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";


// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDgvZFHAQeTBZYtS6OJ_lSvvosV_JN2sPc",
    authDomain: "webfitlog.firebaseapp.com",
    projectId: "webfitlog",
    storageBucket: "webfitlog.appspot.com",
    messagingSenderId: "471149415032",
    appId: "1:471149415032:web:a05386b2d086e86f513b8d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app); //added this for login

//===========================================================================================

let foodItems = {}; // Stores food items and their calorie/protein values
let selectedFood = null; // Currently selected food item
let DBnowDateYMD = null; //contains current date
let DBnowDateYear = null;
let DBnowDateMonth = null;
let DBnowDateDay = null;
let DBnowTime = null;
let DBnowRaw = null;
let TransStartDate = 0;
let daysSinceStarted = 0;
let weeksSinceStarted=0;
let ProgressTodayCal=0;
let ProgressTodayPro=0;
let ProgressYesterdayCal=0;
let ProgressYesterdayPro=0;
let previousUpdatedWeight=0;
let UserId;
let editingYesterday;
let userGoals = { dailyCalorieTarget: 0, dailyProteinTarget: 0 };
let userWeightGoals = { weightTarget: 0};
updateDateTime(); // Initialize the date and time display

// Gets and sets current time and date
function updateDateTime() 
{
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = now.getDate().toString().padStart(2, '0');
    DBnowRaw = now;
    DBnowDateYear = year;
    DBnowDateMonth = month;
    DBnowDateDay = day;
    DBnowDateYMD = `${year}-${month}-${day}`;
    const dateString = now.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' });
    const timeString = now.toLocaleTimeString();
    DBnowTime = timeString;
   // document.getElementById('currentDateTime').textContent = DBnowDateYMD + ' ' + timeString; //this displays it on the page
    
}

//==================================================================================================
//|||||||||||||||||||||||||||||||new loghin features||||||||||||||||||||||||||||||||||||||||||||||||
//==================================================================================================

setPersistence(auth, browserLocalPersistence);


// Sign Up func
function signUp() 
{
    const semail = document.getElementById('semail').value;
    const spassword = document.getElementById('spassword').value;
    const name = document.getElementById('name').value; // Get the name

    createUserWithEmailAndPassword(auth, semail, spassword)
        .then((userCredential) => {
            // User created
                             // console.log("User created: ", userCredential.user);
            const userId = userCredential.user.uid;

            // Store the name in the database
            const userNameRef = ref(db, userId + '/UserDetails/name');
            set(userNameRef, name);
            signupDBinitialization();
            document.getElementById('name').value='';
            document.getElementById('semail').value='';
            document.getElementById('spassword').value='';
        })
        .catch((error) => {
            showError('INVALID CREDESTIALS !');
            // console.error("Signup Error: ", error);
        });
}

// Login Function
function logIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // User is logged in
                                              // console.log("User logged in: ", userCredential.user);
            document.getElementById('email').value='';
            document.getElementById('password').value='';

            // Hide login container and show content container
            document.getElementById('loginCont').classList.add('hidden');
            document.getElementById('loggedinCont').classList.remove('hidden');
            // console.error("inside login func");
            
        })
        .catch((error) => {
            console.error("Login Error: ", error);
            showError('INVALID CREDESTIALS !');
            // Optionally, handle login errors (e.g., wrong password, no user found, etc.)
        });
}


import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    if (user) 
    {
        // User is signed in
        // console.log("User is signed innnn as: ", user);
        // document.getElementById('loginCont').classList.add('hidden');
        document.getElementById('loggedinCont').classList.remove('hidden');
       
        const userId = auth.currentUser.uid;
        UserId=userId;
                                    // console.log("--UID is: ", UserId);
        document.getElementById('loginCont').classList.add('hidden');
        fetchGoalsData();
        fetchAndDisplayFoodItems();

        // Reference to the user's name in the database
        const userNameRef = ref(db, userId + '/UserDetails/name');

        // Fetch and display the name
        onValue(userNameRef, (snapshot) => {
        const name = snapshot.val();
        document.getElementById('userName').textContent = name ? name.toUpperCase() : 'NAME NOT SET';
        });


        fetchCategoriesAndItems(UserId);
    } 
    else 
    {
        // User is signed out
        console.log("User is already signed out");
        document.getElementById('loginCont').classList.remove('hidden');
    }
});


// Sign Out Function
function signOutUser() {
    signOut(auth).then(() => {
        // Sign-out successful.
        console.log("User just signed out");

        // Optionally, update UI: hide content and show login form
        document.getElementById('loggedinCont').classList.add('hidden');
        document.getElementById('loginCont').classList.remove('hidden');
        showOrHideSettings();
    }).catch((error) => {
        // An error happened.
        console.error("Sign Out Error: ", error);
    });
}

document.getElementById('signupLoginCardToggle').addEventListener('click', function()
{
    var loginDiv = document.getElementById('loginCardid');
    var signupDiv = document.getElementById('signupCardid');
    
    if (this.textContent === 'SIGNUP') {
        this.textContent = 'LOGIN';
    } else {
        this.textContent = 'SIGNUP';
    }

    if (signupDiv.classList.contains('hidden')) {
        signupDiv.classList.remove('hidden');
        loginDiv.classList.add('hidden');
    } else {
        signupDiv.classList.add('hidden');
        loginDiv.classList.remove('hidden');
    }
});

// Event Listeners
document.getElementById('signOut').addEventListener('click', signOutUser);
document.getElementById('signup').addEventListener('click', signUp);
document.getElementById('login').addEventListener('click', logIn);

function showError(message) {
    const errorDiv = document.getElementById('errorDiv');
    errorDiv.textContent = message;
    errorDiv.style.display = 'flex';
    errorDiv.style.opacity = 1;
    errorDiv.style.transform = 'translate(0, 136px)';

    setTimeout(() => {
        errorDiv.style.opacity = 0;
        errorDiv.style.transform = 'translate(0, 146px)';
        errorDiv.classList.add('error-message2 ');
        setTimeout(() => errorDiv.style.display = 'none', 500);
    }, 2000);
}


//===================================================================================================
//||||||||||||||||||||||||||||||||||||||||||||||ends|||||||||||||||||||||||||||||||||||||||||||||||||
//===================================================================================================


function signupDBinitialization()
{
    console.log("New user signed up. Initialized all userGoals")
    set(ref(db, UserId + '/UserDetails/theme'),"");
    set(ref(db, UserId + '/UserGoals/transformationStartDate'),"");
    set(ref(db, UserId + '/UserGoals/weightTarget'),"");
    set(ref(db, UserId + '/UserGoals/startingWeight'),"");
    set(ref(db, UserId + '/UserGoals/dailyCalorieTarget'),"");
    set(ref(db, UserId + '/UserGoals/dailyProteinTarget'),"");
    set(ref(db, UserId + '/UserGoals/transformationDuration'),"");
    set(ref(db, UserId + '/UserGoals/currentWeight'),"");
    set(ref(db, UserId + '/UserGoals/previousUpdatedWeight'),"");
    set(ref(db, UserId + '/UserGoals/transformationStartDate'), DBnowDateYMD);
    
}


//====================================================================================================== T O P =======================================================================================================


//Function to get days since log started by counting the number of data inside foodLog in DB
function countDaysSinceStarted() // TOP
{   
    const daySinceStarted = ref(db, UserId + '/UserGoals/transformationStartDate');
    onValue(daySinceStarted, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            TransStartDate = data;
        }
    });

    daysSinceStarted = calculateDaysElapsed(TransStartDate);
    // console.log("dayss: ", daysSinceStarted);
    if (!isNaN(daysSinceStarted) && daysSinceStarted>=0)
    {
        document.getElementById('daysSS').textContent = daysSinceStarted;
    }
}

// Function to calculate the number of week since log started
function countWeeksSinceStarted() //Top
{
    weeksSinceStarted = Math.ceil(daysSinceStarted / 7);
    // console.log("weekss: ", weeksSinceStarted);
    if (!isNaN(weeksSinceStarted) && weeksSinceStarted>=0)
    {
        document.getElementById('weekSS').textContent = weeksSinceStarted;
    }
    
   
}


//for the workout count
function calculateDayOfWeek() 
{
    var nthDay = (daysSinceStarted % 7)+1;
    var nthDayCountDown = 7 - nthDay;
    var thisWeekCurrentValue;

    const lastUpdatedRef = ref(db, UserId + '/UserGoals/workout/lastUpdated');
    const thisWeekRef = ref(db, UserId + '/UserGoals/workout/thisWeek');

    get(thisWeekRef).then((snapshot) => 
    {
        if (snapshot.exists()) 
        {
            thisWeekCurrentValue = snapshot.val();
            document.getElementById('workoutDaysIwent').textContent = thisWeekCurrentValue;
        } 

        get(lastUpdatedRef).then((snapshot) => 
        {
            if (snapshot.val() !== DBnowDateYMD) 
            {
                if(nthDay==1 && thisWeekCurrentValue!=0)
                {
                    set(thisWeekRef, 0);
                }
            }
        });

    });
    
    

    if (!isNaN(nthDay))
    {
        // if(nthDay==0)
        document.getElementById('workoutDays').textContent = nthDay;
        document.getElementById('workoutCountDown').textContent = nthDayCountDown;

        // if(nthDay==1)
        // {

        // }
        
    }
}

// function to show the weight progress percentage on the FE
function setProgress()
{
    if (getCurrentWeightFromDB()>0)
    {
        const progressPercentage = (Math.abs(((getCurrentWeightFromDB()-getStartingWeightFromDB())/(getWeightTargetFromDB()-getStartingWeightFromDB()))*100)).toFixed(0);
        document.getElementById('progPercentage').textContent = progressPercentage;
        // console.log("in-week%: ", progressPercentage);
    }
       
    // if (!isNaN(weeksSinceStarted) && weeksSinceStarted>=0)
    // {
    //     const progressPercentage = (Math.abs(((getCurrentWeightFromDB()-getStartingWeightFromDB())/(getWeightTargetFromDB()-getStartingWeightFromDB()))*100)).toFixed(0);
    //     document.getElementById('progPercentage').textContent = progressPercentage;
    // }
}

// function setWeekProgress()
// {
//     weeksSinceStarted = Math.ceil(daysSinceStarted / 7);
//     const WeekProgressPercentage = (((weeksSinceStarted)/(getTransDuration())*100)).toFixed(0);
//     document.getElementById('progWeekPercentage').textContent = WeekProgressPercentage;
// }










//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
//goals popup================================================================================================


//button to open the setGoals popup
document.getElementById('openSetGoals').addEventListener('click', function() 
{
    var popup = document.getElementById('setGoalsForm');
    popup.classList.remove('hidden');
    popup.style.opacity = 0; // Start with opacity 0
    // popup.style.top = '10px'; // Start position

    // Timeout to allow CSS to catch up
    setTimeout(function() {
        popup.style.opacity = 1; // End with full opacity
        popup.style.top = '-1px'; // End position
    }, 10); // Small delay
});


  




  document.getElementById('yesButton').addEventListener('click', function() {
    console.log(DBnowDateYMD);

    const lastUpdatedRef = ref(db, UserId + '/UserGoals/workout/lastUpdated');
    get(lastUpdatedRef).then((snapshot) => {
        // Check if lastUpdated is not today
        if (!snapshot.exists() || snapshot.val() !== DBnowDateYMD) {
            // Update lastUpdated to today
            set(lastUpdatedRef, DBnowDateYMD).then(() => {
                console.log("lastUpdated set to today.");

                // After successfully setting lastUpdated, increment thisWeek and total
                const thisWeekRef = ref(db, UserId + '/UserGoals/workout/thisWeek');
                get(thisWeekRef).then((snapshot) => {
                    const thisWeekValue = snapshot.exists() ? snapshot.val() + 1 : 1;
                    set(thisWeekRef, thisWeekValue).then(() => console.log("thisWeek incremented."));
                });





                const totalRef = ref(db, UserId + '/UserGoals/workout/total');
                get(totalRef).then((snapshot) => {
                    const totalValue = snapshot.exists() ? snapshot.val() + 1 : 1;
                    set(totalRef, totalValue).then(() => console.log("total incremented."));
                });


            }).catch((error) => console.error("Error updating lastUpdated:", error));
        } else {
            console.log("lastUpdated is already set to today. No action taken.");
        }
    }).catch((error) => {
        console.error("Error fetching lastUpdated:", error);
    });
});












// Function to submit goals to Firebase from inside the setGoals popup
document.getElementById('submitGoals').addEventListener('click', function() 
{
    const weightTarget = parseFloat(document.getElementById('weightTarget').value);
    const dailyCalorieTarget = parseFloat(document.getElementById('dailyCalorieTarget').value);
    const dailyProteinTarget = parseFloat(document.getElementById('dailyProteinTarget').value);
    const weektarget = parseFloat(document.getElementById('weekTarget').value);
    const startWeight = parseFloat(document.getElementById('StartingWeight').value);
    const currentWeight = parseFloat(document.getElementById('currentWeight').value);
    
    if (!isNaN(weightTarget))
    {
        const userGoalsRef = ref(db, UserId + '/UserGoals/weightTarget');
        set(userGoalsRef, weightTarget);
    } 
    if (!isNaN(dailyCalorieTarget))
    {
        const userGoalsRef = ref(db, UserId + '/UserGoals/dailyCalorieTarget');
        set(userGoalsRef, dailyCalorieTarget);
    } 
    if (!isNaN(dailyProteinTarget))
    {
        const userGoalsRef = ref(db, UserId + '/UserGoals/dailyProteinTarget');
        set(userGoalsRef, dailyProteinTarget);
    } 
    if (!isNaN(weektarget))
    {
        const userGoalsRef = ref(db, UserId + '/UserGoals/transformationDuration');
        set(userGoalsRef, weektarget);
    } 
    if (!isNaN(startWeight))
    {
        const setStartWeightRef = ref(db, UserId + '/UserGoals/startingWeight');
        set(setStartWeightRef, startWeight);
    } 
    if (!isNaN(currentWeight))
    {
        const previousUpdatedWeight2=getCurrentWeightFromDB();
        const setCurrentWeightRef = ref(db, UserId + '/UserGoals/currentWeight');
        const setpreviouslyUpdatedWeightRef = ref(db, UserId + '/UserGoals/previousUpdatedWeight');
        set(setCurrentWeightRef, currentWeight);
        set(setpreviouslyUpdatedWeightRef, previousUpdatedWeight2);
    } 
    document.getElementById('weightTarget').value = '';
    document.getElementById('StartingWeight').value = '';
    document.getElementById('dailyCalorieTarget').value = '';
    document.getElementById('dailyProteinTarget').value = '';
    document.getElementById('weekTarget').value = '';
    document.getElementById('currentWeight').value = '';
    document.getElementById('setGoalsForm').classList.add('hidden');

});

//this is the "yes" toggle button which shows the confirm button
document.getElementById('showResetBtn').addEventListener('click', function() {
    var resetGoalStart = document.getElementById('resetGoalStart');
    
    if (this.textContent === 'YES') {
        this.textContent = 'ABORT';
    } else {
        this.textContent = 'YES';
    }

    if (resetGoalStart.classList.contains('hidden')) {
        resetGoalStart.classList.remove('hidden');
    } else {
        resetGoalStart.classList.add('hidden');
    }
});


//this is the "confirm" button that sets the currernt day to today
document.getElementById('resetGoalStart').addEventListener('click', function() 
{
    setStartDateForToday();
    resetWorkouts();
    var showResetBtn = document.getElementById('showResetBtn');
    showResetBtn.textContent = 'YES';
    
    document.getElementById('resetGoalStart').classList.add('hidden');
});

function setStartDateForToday()
{
    const userGoalsRef = ref(db, UserId + '/UserGoals/transformationStartDate');
    const transStartDate = DBnowDateYMD;
    set(userGoalsRef, transStartDate);
}
function resetWorkouts()
{
    const lastUpdatedWorkoutRef = ref(db, UserId + '/UserGoals/workout/lastUpdated');
    const thisWeeksWorkoutRef = ref(db, UserId + '/UserGoals/workout/thisWeek');
    const totalWorkoutRef = ref(db, UserId + '/UserGoals/workout/total');
    set(thisWeeksWorkoutRef, 0);
    set(totalWorkoutRef, 0);
    set(lastUpdatedWorkoutRef, 0);
}

// Function to cancel setting goals popup
document.getElementById('cancelGoals').addEventListener('click', function() 
{
    var xshowResetBtn = document.getElementById('showResetBtn');
    xshowResetBtn.textContent = 'YES';

    document.getElementById('setGoalsForm').classList.add('hidden');
    // Reset form fields
    document.getElementById('weightTarget').value = '';
    document.getElementById('StartingWeight').value = '';
    document.getElementById('dailyCalorieTarget').value = '';
    document.getElementById('dailyProteinTarget').value = '';
    document.getElementById('weekTarget').value = '';
    document.getElementById('currentWeight').value = '';
    document.getElementById('resetGoalStart').classList.remove('resetGoaldatehdn');
    document.getElementById('resetGoalStart').classList.add('resetGoaldate');
    document.getElementById('resetGoalStart').classList.add('hidden');
});


//goalos popup ends============================================================================
//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
//================================================================================================== T O P    E N D ==================================================================================================

//worked out? popup and buttons

  

  




//====================================================================================================== M I D =======================================================================================================

// Function to fetch and display food items from the database on the list
function fetchAndDisplayFoodItems() // Mid
{
    // const foodItemsRef = ref(db, UserId + '/foodItems');
    // console.log("Error deleting food item: ",UserId);
    const foodItemsRef = ref(db, `${UserId}/foodItems`);
    onValue(foodItemsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            foodItems = data; // Update local foodItems object
            updateFoodDropdown(); // Update dropdown on the page
            updateExistingFoodItemsList(); // Update list in the popup
        }
    });
}


// Function to Edit/delete food items 
function updateExistingFoodItemsList() {
    const listContainer = document.getElementById('existingFoodItemsList');
    listContainer.innerHTML = '';

    for (const foodName in foodItems) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'food-item';

        const nameLabel = document.createElement('span');
        nameLabel.className = 'manageItemnames';
        nameLabel.textContent = foodName;
        itemDiv.appendChild(nameLabel);

        const caloriesInput = document.createElement('input');
        caloriesInput.className = 'inputFields2';
        caloriesInput.type = 'number';
        caloriesInput.value = foodItems[foodName].caloriesPerGram;
        caloriesInput.disabled = true;
        itemDiv.appendChild(caloriesInput);

        const proteinInput = document.createElement('input');
        proteinInput.className = 'inputFields2';
        proteinInput.type = 'number';
        proteinInput.value = foodItems[foodName].proteinPerGram;
        proteinInput.disabled = true;
        itemDiv.appendChild(proteinInput);

        const editButton = document.createElement('button');
        editButton.className = 'addBtnMng2';
        editButton.textContent = 'Edit';
        itemDiv.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'addBtnMng2';
        deleteButton.textContent = 'Delete';
        deleteButton.disabled = true;
        deleteButton.style.backgroundColor = 'gray';
        deleteButton.style.color = '#525252';
        itemDiv.appendChild(deleteButton);

        editButton.onclick = () => toggleEdit(foodName, caloriesInput, proteinInput, editButton, deleteButton);
        deleteButton.onclick = () => deleteFoodItem(foodName);

        listContainer.appendChild(itemDiv);
    }
}

function toggleEdit(foodName, caloriesInput, proteinInput, editButton, deleteButton) {
    const isEditable = caloriesInput.disabled;
    caloriesInput.disabled = !isEditable;
    proteinInput.disabled = !isEditable;
    deleteButton.disabled = !isEditable;
    deleteButton.style.backgroundColor = isEditable ? 'red' : 'gray';
    deleteButton.style.color = isEditable ? 'white' : '#525252';

    editButton.textContent = isEditable ? 'Done' : 'Edit';

    if (!isEditable) {
        updateFoodItem(foodName, parseFloat(caloriesInput.value), parseFloat(proteinInput.value));
    }
}


// Function to delete an existing food item
function deleteFoodItem(foodName) // Mid
{
    if (confirm(`Are you sure you want to delete ${foodName}?`)) {
        const foodItemRef = ref(db, UserId + `/foodItems/${foodName}`);
        remove(foodItemRef).then(() => {
            alert(`${foodName} has been deleted.`);
            fetchAndDisplayFoodItems(); // Refresh the food items list
        }).catch((error) => {
            console.error("Error deleting food item: ", error);
        });
    }
}


// Update food dropdown on the page
function updateFoodDropdown() // Mid
{
    const dropdown = document.getElementById('foodItemDropdown');
    // Clear existing options except the first
    dropdown.options.length = 1; 
    for (const foodName in foodItems) {
        const option = new Option(foodName, foodName);
        dropdown.add(option);
    }
    // Always add the "Add New Item" option at the end
    dropdown.add(new Option("~ Manage Items ~", "addNewItem"));
}


// Function to add food item to the database
function addFoodItemToDB(foodName, caloriesPerGram, proteinPerGram) // Mid
{
    const foodItemRef = ref(db, UserId + `/foodItems/${foodName}`);
    set(foodItemRef, { caloriesPerGram, proteinPerGram });
}



function updateFoodItem(foodName, caloriesPerGram, proteinPerGram) //duplicate. doesnt work
{
    const foodItemRef = ref(db, UserId + `/foodItems/${foodName}`);
    set(foodItemRef, { caloriesPerGram, proteinPerGram });
}

// Event listener for food item dropdown
document.getElementById('foodItemDropdown').addEventListener('change', function() // Mid
{
    const selectedValue = this.value;
    if (selectedValue === 'addNewItem') {
        editFoodItems(); // Call the function to add a new food item
    } else {
        selectedFood = selectedValue; // Set the selected food item
    }
});


// Add food consumption to the database
function addFoodConsumption() // Mid
{
    if (!selectedFood) {
        alert('Please select a food item.');
        return;
    }

    const amount = parseFloat(document.getElementById('foodAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }

    updateDateTime();
    const foodData = foodItems[selectedFood];
    const calories = amount * foodData.caloriesPerGram;
    const protein = amount * foodData.proteinPerGram;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr2 = formatDate(yesterday);
    // console.log(editingYesterday);

    if(editingYesterday==1)
    {
        const foodLogRef = ref(db, UserId + `/foodLog/${yesterdayStr2}/${selectedFood}`);
        onValue(foodLogRef, (snapshot) => {
        const data = snapshot.val() || { totalCalories: 0, totalProtein: 0 };
        data.totalCalories += calories;
        data.totalProtein += protein;
        set(foodLogRef, data);
        }, { onlyOnce: true });
    }
    else
    {
        const foodLogRef = ref(db, UserId + `/foodLog/${DBnowDateYMD}/${selectedFood}`);
        onValue(foodLogRef, (snapshot) => {
        const data = snapshot.val() || { totalCalories: 0, totalProtein: 0 };
        data.totalCalories += calories;
        data.totalProtein += protein;
        set(foodLogRef, data);
        }, { onlyOnce: true });
    }

    document.getElementById('foodAmount').value = '';
    document.getElementById('foodItemDropdown').selectedIndex = 0;
    selectedFood = null; // Reset the selected food
}



// Edit food items functionality and makes the managing food form visible
function editFoodItems()   // Mid
{
    document.getElementById('addFoodForm').classList.remove('hidden');
}

// Event listener for adding a new food item from the form
document.getElementById('submitNewFood').addEventListener('click', function() // Mid
{
    const foodName = document.getElementById('newFoodName').value;
    const caloriesPerGram = parseFloat(document.getElementById('newCaloriesPerGram').value);
    const proteinPerGram = parseFloat(document.getElementById('newProteinPerGram').value);

    if (foodName && !isNaN(caloriesPerGram) && !isNaN(proteinPerGram)) {
        addFoodItemToDB(foodName, caloriesPerGram, proteinPerGram);
        document.getElementById('addFoodForm').classList.add('hidden');
        // Reset form fields
        document.getElementById('newFoodName').value = '';
        document.getElementById('newCaloriesPerGram').value = '';
        document.getElementById('newProteinPerGram').value = '';
    } 
    else 
    {
        alert('Please enter valid details.');
    }
});



// Event listener for canceling the add food item action
document.getElementById('cancelNewFood').addEventListener('click', function() // Mid
{
    document.getElementById('addFoodForm').classList.add('hidden');
    // Reset form fields
    document.getElementById('newFoodName').value = '';
    document.getElementById('newCaloriesPerGram').value = '';
    document.getElementById('newProteinPerGram').value = '';
    updateFoodDropdown();
});



// Function to update today's stats to show on the FE
function updateTodaysStats() // Mid
{
    // 
    updateDateTime;
    const date = DBnowDateYMD;
    const dayLogRef = ref(db, UserId + `/foodLog/${date}`);
    onValue(dayLogRef, (snapshot) => {
        const data = snapshot.val();
        let totalCalories = 0, totalProtein = 0;
        for (const food in data) {
            totalCalories += data[food].totalCalories;
            totalProtein += data[food].totalProtein;
        }
        ProgressTodayCal=totalCalories;
        ProgressTodayPro=totalProtein;

        document.getElementById('todaysCalories').textContent = totalCalories.toFixed(1);
        document.getElementById('todaysProtein').textContent = totalProtein.toFixed(1);
    });
}


//function to get average from start date
function GetAverageFromStartDate() {
    let totalCalories = 0;
    let totalProtein = 0;
    let daysCounted = 0;
    let avgCalories = 0;
    let avgProtein = 0;

    // Fetch all foodLog entries
    const foodLogRef = ref(db, UserId + '/foodLog/');
    get(foodLogRef).then((snapshot) => {
        if (snapshot.exists()) {
            const foodLogData = snapshot.val();
            const foodLogDates = Object.keys(foodLogData);

            // Get the transformation start date
            const transStartDateRef = ref(db, UserId + '/UserGoals/transformationStartDate');
            get(transStartDateRef).then((transSnapshot) => {
                const transStartDate = transSnapshot.val();
                const startDateIndex = foodLogDates.indexOf(transStartDate);

                // Iterate from start date index to yesterday's index
                for (let i = startDateIndex; i < foodLogDates.length - 1; i++) {
                    const currentDate = foodLogDates[i];
                    const dayData = foodLogData[currentDate];

                    for (const food in dayData) {
                        totalCalories += dayData[food].totalCalories;
                        totalProtein += dayData[food].totalProtein;
                    }
                    daysCounted++;
                }

                // Calculate averages
                if (daysCounted > 0) {
                    avgCalories = totalCalories / daysCounted;
                    avgProtein = totalProtein / daysCounted;
                }

                // Update DOM
                if(avgCalories!=0)
                {
                    document.getElementById('AvgCalPday').textContent = avgCalories.toFixed(0);
                }
                if(avgProtein!=0)
                {
                    document.getElementById('AvgPrtPday').textContent = avgProtein.toFixed(0);
                }
                
                
            });
        } else {
            // console.log("No food log data available");
        }
    }).catch((error) => {
        console.error("Error fetching food log data: ", error);
    });
}

// =========================================================================================



//function to get average from last 6 days
function GetAverageFromLast6Days() {
    let totalCalories = 0;
    let totalProtein = 0;
    let daysCounted = 0;
    let avgCalories = 0;
    let avgProtein = 0;
    let SuggestedTodaycal=0;
    let SuggestedTodaypro=0;

    // Fetch all foodLog entries
    const foodLogRef = ref(db, UserId + '/foodLog/');
    get(foodLogRef).then((snapshot) => {
        if (snapshot.exists()) {
            const foodLogData = snapshot.val();
            const foodLogDates = Object.keys(foodLogData);

            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const sixDaysAgo = new Date(yesterday);
            sixDaysAgo.setDate(sixDaysAgo.getDate() - 5);

            const yesterdayStr = formatDate(yesterday);
            const sixDaysAgoStr = formatDate(sixDaysAgo);

            const yesterdayIndex = foodLogDates.indexOf(yesterdayStr);
            const sixDaysAgoIndex = Math.max(foodLogDates.indexOf(sixDaysAgoStr), 0);

            // Iterate from six days ago index to yesterday's index
            for (let i = Math.max(yesterdayIndex - 5, sixDaysAgoIndex); i <= yesterdayIndex; i++) {
                const currentDate = foodLogDates[i];
                const dayData = foodLogData[currentDate];

                for (const food in dayData) {
                    totalCalories += dayData[food].totalCalories;
                    totalProtein += dayData[food].totalProtein;
                }
                daysCounted++;
            }

            // Calculate averages
            if (daysCounted > 0) {
                // console.log('daysCounted: '+daysCounted);
                avgCalories = totalCalories / daysCounted;
                avgProtein = totalProtein / daysCounted;
                SuggestedTodaycal=(userGoals.dailyCalorieTarget*(daysCounted+1))-totalCalories;
                SuggestedTodaypro=(userGoals.dailyProteinTarget*(daysCounted+1))-totalProtein;
            }

            // Update DOM
            if(avgCalories!=0)
            {
                document.getElementById('AvgCal6day').textContent = avgCalories.toFixed(0);
            }
            if(avgProtein!=0)
            {
                document.getElementById('AvgPrt6day').textContent = avgProtein.toFixed(0);
            }
            if(SuggestedTodaycal!=0)
            {
                document.getElementById('suggCal').textContent = SuggestedTodaycal.toFixed(0);
            }
            else
            {
                document.getElementById('suggCal').textContent = userGoals.dailyCalorieTarget;
            }

            if(SuggestedTodaypro!=0)
            {
                document.getElementById('suggPro').textContent = SuggestedTodaypro.toFixed(0);
            }
            else
            {
                document.getElementById('suggPro').textContent = userGoals.dailyProteinTarget;
            }

        } 
        else 
        {
            // console.log("No food log data available");
        }
    }).catch((error) => {
        console.error("Error fetching food log data: ", error);
    });
}









// Function to update other stats (yesterday's, this week's, last week's)
function updateYesterdaysStats() //have to fix=======================================Fixed
{ 
    updateDateTime();
    let yesterday = DBnowRaw;
    const yesterdayx = DBnowRaw;
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = formatDate(yesterday);

    const dayLogRef = ref(db, UserId + `/foodLog/${dateStr}`);
    onValue(dayLogRef, (snapshot) => {
        const data = snapshot.val();
        let totalCalories = 0, totalProtein = 0;
        if (data) {
            for (const food in data) {
                totalCalories += data[food].totalCalories;
                totalProtein += data[food].totalProtein;
            }
        }

        ProgressYesterdayCal=totalCalories;
        ProgressYesterdayPro=totalProtein;
        document.getElementById('yesterdaysCalories').textContent = totalCalories.toFixed(1); 
        document.getElementById('yesterdaysProtein').textContent = totalProtein.toFixed(1);
    });
}

// Function to update progress bars
function updateProgressBars() {
    const calorieProgress = document.getElementById('calorieProgress');
    const proteinProgress = document.getElementById('proteinProgress');
    const YstrdcalorieProgress = document.getElementById('YstrdcalorieProgress');
    const YstrdproteinProgress = document.getElementById('YstrdproteinProgress');

    let caloriePercentage = 0;
    let proteinPercentage = 0;
    let yescaloriePercentage = 0;
    let yesproteinPercentage = 0;
    

    if (userGoals.dailyCalorieTarget >= 0) {
        caloriePercentage = (ProgressTodayCal / userGoals.dailyCalorieTarget) * 100;
        yescaloriePercentage = (ProgressYesterdayCal / userGoals.dailyCalorieTarget) * 100;
    }
    // console.log(caloriePercentage);

    if (userGoals.dailyProteinTarget >= 0) {
        proteinPercentage = (ProgressTodayPro / userGoals.dailyProteinTarget) * 100;
        yesproteinPercentage = (ProgressYesterdayPro / userGoals.dailyProteinTarget) * 100;
    }



    if(caloriePercentage==0)
    {
        calorieProgress.style.height = Math.min(100, 100) + '%';
        document.getElementById('calorieProgress').style.backgroundImage = "url('images/StripesGrayVertical.jpg')";
        document.getElementById('calorieProgress').style.backgroundSize = "cover";
    }
    else
    {
        calorieProgress.style.height = Math.min(caloriePercentage, 100) + '%';
        document.getElementById('calorieProgress').style.background = 'linear-gradient(rgb(112 236 255) 10%, rgb(112 1 255) 70%)';
    }


    if(proteinPercentage==0)
    {
        proteinProgress.style.height = Math.min(100, 100) + '%';
        document.getElementById('proteinProgress').style.backgroundImage = "url('images/StripesGrayVertical.jpg')";
        document.getElementById('proteinProgress').style.backgroundSize = "cover";
    }
    else
    {
        proteinProgress.style.height = Math.min(proteinPercentage, 100) + '%';
        document.getElementById('proteinProgress').style.background = 'linear-gradient(rgb(200 41 253) 10%, rgb(254 1 3) 70%)';
    }


    if(yescaloriePercentage==0)
    {
        YstrdcalorieProgress.style.height = Math.min(100, 100) + '%';
        document.getElementById('YstrdcalorieProgress').style.backgroundImage = "url('images/StripesGrayVertical.jpg')";
        document.getElementById('YstrdcalorieProgress').style.backgroundSize = "cover"; 
    }
    else
    {
        YstrdcalorieProgress.style.height = Math.min(yescaloriePercentage, 100) + '%';
        document.getElementById('YstrdcalorieProgress').style.background = 'linear-gradient(rgb(86 248 115) 10%, rgb(10 146 238) 70%)';
    }


    if(yesproteinPercentage==0)
    {
        YstrdproteinProgress.style.height = Math.min(100, 100) + '%';
        // document.getElementById('YstrdproteinProgress').style.setProperty('background', 'linear-gradient(180deg, #4f4f4f 100%, #3f3f3f 10%)', 'important');
        document.getElementById('YstrdproteinProgress').style.backgroundImage = "url('images/StripesGrayVertical.jpg')";
        document.getElementById('YstrdproteinProgress').style.backgroundSize = "cover";

    }
    else
    {
        YstrdproteinProgress.style.height = Math.min(yesproteinPercentage, 100) + '%';
        document.getElementById('YstrdproteinProgress').style.background = 'linear-gradient(rgb(236 243 0) 10%, rgb(253 63 0) 70%)';
    }
    
}





function getStartAndEndOfWeek(date) 
{
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    return { start, end };
}




function updateThisWeeksStats()
{
    const { start, end } = getStartAndEndOfWeek(new Date());
    calculateWeeklyStats(start, end, 'thisWeeksAvgCalories', 'thisWeeksAvgProtein');
}




function updateLastWeeksStats() 
{
    const now = new Date();
    const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    const { start, end } = getStartAndEndOfWeek(lastWeek);
    calculateWeeklyStats(start, end, 'lastWeeksAvgCalories', 'lastWeeksAvgProtein');
}

function calculateWeeklyStats(start, end, caloriesElementId, proteinElementId) {
    let totalCalories = 0, totalProtein = 0, daysCounted = 0;
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = formatDate(d);
        const dayLogRef = ref(db, UserId + `/foodLog/${dateStr}`);
        onValue(dayLogRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                for (const food in data) {
                    totalCalories += data[food].totalCalories;
                    totalProtein += data[food].totalProtein;
                }
                daysCounted++;
                if (daysCounted === 7) {
                    const avgCalories = (totalCalories / daysCounted).toFixed(2);
                    const avgProtein = (totalProtein / daysCounted).toFixed(2);
                    document.getElementById(caloriesElementId).textContent = avgCalories;
                    document.getElementById(proteinElementId).textContent = avgProtein;
                }
            }
        }, { onlyOnce: true });
    }
}

function setWtChangeSinceDayOne()
{
    const wtChngSinceDayOne = (getCurrentWeightFromDB()-getStartingWeightFromDB()).toFixed(0);
    document.getElementById('wtChngSinceDayOne').textContent = wtChngSinceDayOne;
    
    const wtChangeSinceLastUpdate = (getCurrentWeightFromDB()-getLastUpdatedWeightFromDB()).toFixed(0);
    document.getElementById('wtChangeSinceLastUpdate').textContent =wtChangeSinceLastUpdate;
}





function updateStats() 
// { console.log('inside Update stats');
{
    updateTodaysStats();
    updateYesterdaysStats();
    updateThisWeeksStats();
    updateLastWeeksStats();
    updateProgressBars();
    updateWeightData();
    setWtChangeSinceDayOne();
   
    // setWeekProgress();
}
//===================================================================================================== M I D    E N D======================================================================================================











//====================================================================================================== B O T T O M =======================================================================================================




//================================================================================================== B O T T O M    E N D ==================================================================================================










//====================================================================================================== HELPER FUNCTIONS =======================================================================================================





function formatDate(dt) {
    const now = dt;
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = now.getDate().toString().padStart(2, '0');
   
    let retdt = `${year}-${month}-${day}`;
    return retdt;
}


function reverseFormat_Day(YMD)
{
    const date = new Date(YMD);
    return date.getDate(); // Returns the day of the month (dd) from the date

}


function calculateDaysElapsed(startDate) {
    const startDateObj = new Date(startDate);
    const today = new Date();

    // Set the time of both dates to 00:00:00 for accurate day comparison
    startDateObj.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDifference = today - startDateObj;
    const daysElapsed = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

    return daysElapsed;
}



function getTransDuration()
{
    let TransDuration = 0;
    const TransDurationRef = ref(db, UserId + '/UserGoals/transformationDuration');
    onValue(TransDurationRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            TransDuration = data;
        }
    });

    return TransDuration;

}

function getCurrentWeightFromDB()
{
    let CurrentWeighttDB = 0;
    const weightTargetDBRef = ref(db, UserId + '/UserGoals/currentWeight');
    onValue(weightTargetDBRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            CurrentWeighttDB = data;
        }
    });

    return CurrentWeighttDB;

}


function getLastUpdatedWeightFromDB()
{
    let lastWeighttDB = 0;
    const lastweightTargetDBRef = ref(db, UserId + '/UserGoals/previousUpdatedWeight');
    onValue(lastweightTargetDBRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            lastWeighttDB = data;
        }
    });

    return lastWeighttDB;

}


function getStartingWeightFromDB()
{
    let StartingWeighttDB = 0;
    const startingweightDBRef = ref(db, UserId + '/UserGoals/startingWeight');
    onValue(startingweightDBRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            StartingWeighttDB = data;
        }
    });

    return StartingWeighttDB;

}


function getWeightTargetFromDB()
{
    let weightTargetDB = 0;
    const weightTargetDBRef = ref(db, UserId + '/UserGoals/weightTarget');
    onValue(weightTargetDBRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            weightTargetDB = data;
        }
    });

    return weightTargetDB;

}

//==================================================================================================== HELPER FUNCTIONS ENDS ====================================================================================================







// Select a food item
function selectFood(foodName) //NA
{
    selectedFood = foodName;
}













//progress bar============================================================================


function fetchGoalsData()
{
    // Fetch goals from Firebase
    const userGoalsRef = ref(db, UserId + '/UserGoals');
    onValue(userGoalsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            userGoals = data;
            updateStats(); // Update stats to refresh progress bars
        }
    });


    const weightGoalsRef = ref(db, UserId + '/UserGoals');
    onValue(weightGoalsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            userWeightGoals = data;
            updateStats(); // Update stats to refresh progress bars
        }
    });

    updateTheme();


    
}





//progress bar ends============================================================================
 


//WeightStat==================================================================================

function updateWeightData()
{
    const weightTrgt = getCurrentWeightFromDB();
    document.getElementById('wttrgt').textContent = weightTrgt;
}

//WeightStat ends==================================================================================



//document.getElementById('editFoodItems').addEventListener('click', editFoodItems);
document.getElementById('addFood').addEventListener('click', addFoodConsumption);
document.getElementById('addFood').addEventListener('click', updateStats);
setInterval(countDaysSinceStarted, 1000);
setInterval(countWeeksSinceStarted, 1000);
setInterval(calculateDayOfWeek, 1000);
setInterval(GetAverageFromStartDate, 1000);
setInterval(GetAverageFromLast6Days, 1000);
setInterval(setProgress, 1000);
setInterval(updateLastSixDaysProgressBars, 1000);
setInterval(updateStats, 1000); // Update stats every minute
fetchAndDisplayFoodItems(); // Fetch food items when the page loads
setInterval(updateDateTime, 1000);




/*
if i have to pass a value to the FE from the BE:

document.getElementById('currentDateTime').textContent = DBnowDateYMD + ' ' + timeString; 

here 'currentDateTime' is an ide if the location the text is goint to be visible. for example <div id="currentDateTime" class="dateTimeDisplay"></div>



    <div id="currentDateTime" class="dateTimeDisplay"></div>



*/

// settings cont

document.getElementById('settingsDiv').addEventListener('click', function() 
{
    showOrHideSettings();
});

function showOrHideSettings()
{
    var settingsCont = document.getElementById('settingsCont');

    if (settingsCont.classList.contains('visible')) {
        // If visible, hide it
        settingsCont.classList.remove('visible');
        setTimeout(function() {
            settingsCont.classList.add('hidden');
        }, 1000); // wait for transition to complete
    } else {
        // If hidden, show it
        settingsCont.classList.remove('hidden');
        setTimeout(function() {
            settingsCont.classList.add('visible');
        }, 10);
    }
}

document.addEventListener('click', function(event) {
    var settingsCont = document.getElementById('settingsCont');
    var settingsDiv = document.getElementById('settingsDiv');

    // Check if the click is outside settingsCont and not on settingsDiv
    if (!settingsCont.contains(event.target) && event.target !== settingsDiv) {
        if (settingsCont.classList.contains('visible')) {
            settingsCont.classList.remove('visible');
            setTimeout(function() {
                settingsCont.classList.add('hidden');
            }, 1000); // wait for transition to complete
        }
    }
});



//theme change
        // Function to change the theme in the database
        function changeTheme() {
            const themeChangeDiv = document.querySelector('.themeChange');
            const newTheme = themeChangeDiv.textContent === 'LIGHT' ? 'DARK' : 'LIGHT';

            // Update theme in Firebase
            const themeRef = ref(db, UserId + '/UserDetails/theme');
            set(themeRef, newTheme);
            updateTheme();
        }

        // Function to update the UI based on the theme value from Firebase
        function updateTheme() {
            const themeRef = ref(db, UserId + '/UserDetails/theme');
            onValue(themeRef, (snapshot) => {
                const theme = snapshot.val();
                const contentContainer = document.querySelector('.content-container');
                const themeChangeDiv = document.querySelector('.themeChange');
                const themeChangeforOthers = document.querySelector('.OtherServicesBottomViewSection');
                const weeklyChartBorder = document.querySelector('.chartNutriCHILDTop');
                const backgroundColor = document.querySelector('.topBackground');
                const bdy = document.querySelector('.bdy');
                const slideButton = document.querySelector('.OtherServicesMidButtonSection');

                if (theme === 'DARK') 
                {
                    contentContainer.style.backgroundColor = 'rgba(63, 63, 63, 1)';
                    themeChangeDiv.textContent = 'DARK';
                    themeChangeDiv.style.color = 'white';
                    themeChangeDiv.style.backgroundColor = 'black';
                    themeChangeforOthers.style.background = 'linear-gradient(127deg, rgb(0 0 0) 30%, rgb(0 0 0) 85%)';
                    weeklyChartBorder.style.borderColor = '#dcff00';
                    backgroundColor.style.background = 'linear-gradient(182deg, #3e3e3e, rgb(0 0 0))';
                    bdy.style.backgroundColor = 'rgb(63 63 63)';
                    slideButton.style.backgroundColor = '#272727';
                } 
                else 
                {
                    contentContainer.style.backgroundColor = 'white';
                    themeChangeDiv.textContent = 'LIGHT';
                    themeChangeDiv.style.color = 'black';
                    themeChangeDiv.style.backgroundColor = 'white';
                    themeChangeforOthers.style.background = 'linear-gradient(127deg, rgb(175 0 0) 30%, rgba(255, 107, 0, 1) 85%)';
                    weeklyChartBorder.style.borderColor = 'black';
                    backgroundColor.style.background = 'linear-gradient(182deg, #ffffff, #ffffff)';
                    bdy.style.backgroundColor = 'white';
                    slideButton.style.backgroundColor = 'black';
                }
            });
        }

        // Event listener for the themeChange div
        document.querySelector('.themeChange').addEventListener('click', changeTheme);

        // Call updateTheme to initialize the theme on page load
        updateTheme();





        document.getElementById('button1').addEventListener('click', function() {
            showContent('content1');
            updateHighlight(this);
        });
        document.getElementById('button2').addEventListener('click', function() {
            showContent('content2');
            updateHighlight(this);
        });
        document.getElementById('button3').addEventListener('click', function() {
            showContent('content3');
            updateHighlight(this);
        });
        
        function showContent(contentId) {
            // Hide all content divs
            document.querySelectorAll('.content').forEach(div => {
                div.classList.remove('visible');
            });
        
            // Show the selected content div
            document.getElementById(contentId).classList.add('visible');
        }
        
        function updateHighlight(button) {
            const highlight = document.querySelector('.buttonHighlight');
            const width = button.offsetWidth;
            const left = button.offsetLeft;
        
            highlight.style.width = `${width}px`;
            highlight.style.left = `${left}px`;
            document.getElementById('button1').style.color = 'white';
            document.getElementById('button2').style.color = 'white';
            document.getElementById('button3').style.color = 'white';
            button.style.color = 'black';
        }
        
        // Initialize the highlight position and click button 2 on page load
        const initialButton = document.getElementById('button2');
        initialButton.click();
        setTimeout(function() {
            updateHighlight2(initialButton);
        }, 1000); 

        function updateHighlight2(button) 
        {
            const highlight = document.querySelector('.buttonHighlight');
            const width = button.offsetWidth;
            const left = button.offsetLeft;
        
            highlight.style.width = `${width}px`;
            highlight.style.left = `${left}px`;
        }
        


//stats graph bars
function updateLastSixDaysProgressBars() {
    const foodLogRef = ref(db, UserId + '/foodLog/');
    get(foodLogRef).then((snapshot) => {
        if (snapshot.exists()) {
            const foodLogData = snapshot.val();
            const foodLogDates = Object.keys(foodLogData).sort().reverse();
            const today = new Date();
            today.setDate(today.getDate() - 1); // Start with yesterday

            for (let i = 0; i < 6; i++) {
                const dateStr = formatDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
                if (foodLogDates.includes(dateStr)) {
                    const dayData = foodLogData[dateStr];
                    let dailyTotalCalories = 0;
                    let dailyTotalProtein = 0;

                    for (const food in dayData) {
                        dailyTotalCalories += dayData[food].totalCalories;
                        dailyTotalProtein += dayData[food].totalProtein;
                    }

                    // Update the progress bars
                    updateProgressBarC(`calorie${i + 1}`, dailyTotalCalories);
                    updateProgressBarP(`protein${i + 1}`, dailyTotalProtein);
                }
            }
        }
    }).catch((error) => {
        console.error("Error fetching food log data: ", error);
    });
}

function updateProgressBarC(barId, value) 
{
    const progressElement = document.getElementById(barId);
    let Percent=0;

    if (userGoals.dailyCalorieTarget >= 0) 
    {
        Percent = (value / userGoals.dailyCalorieTarget) * 100;
    }
    if (progressElement) 
    {
        progressElement.style.height = Math.min(Percent, 100) + '%';
        
    }
}
function updateProgressBarP(barId, value) 
{
    const progressElement = document.getElementById(barId);
    let Percent=0;

    if (userGoals.dailyProteinTarget >= 0) 
    {
        Percent = (value / (userGoals.dailyProteinTarget)) * 100;
    }
    if (progressElement) 
    {
        progressElement.style.height = Math.min(Percent, 100) + '%';
    }
}

























document.getElementById('yesterdayChartId').addEventListener('click', function() //click the chart warning popus up
{
    document.getElementById("warningPopupId").style.display = "flex";
    document.getElementById('warningPopupId').classList.add('opa');
});


document.getElementById('hideWarningPop').addEventListener('click', function() //no button in warning-dismisses warning
{
    document.getElementById("warningPopupId").style.display = "none";
    document.getElementById('warningPopupId').classList.remove('opa');
});



document.getElementById('editYesId').addEventListener('click', function() //yes button in warning-sets editing mode to 1, dismisses warning and enables edit popup
{
   
    document.getElementById('topSec3InputSecId').style.zIndex = '3';
    editingYesterday = 1;
    document.getElementById("warningPopupId").style.display = "none";
    document.getElementById("editYesIdPop").style.display = "flex";
    
});

document.getElementById('yesterdayEditDoneBt').addEventListener('click', function() //done button dismisses edit mode popup
{
    editingYesterday = 0;
    document.getElementById('topSec3InputSecId').style.zIndex = '0';
    document.getElementById("editYesIdPop").style.display = "none";
});



// document.addEventListener('DOMContentLoaded', function() {
// document.getElementById('WorkoutButton').addEventListener('click', function() {
//     var popup = document.getElementById('workBaalerID');
//     popup.classList.remove('hiddenNew'); // Show the popup
//   });
  
// });

//   document.getElementById('cancelButton').addEventListener('click', function() {
//     var popup = document.getElementById('workBaalerID');
//     popup.classList.add('hiddenNew'); // Hide the popup
//     console.log("ikkh");
//   });














document.getElementById('addCategoryBtn').addEventListener('click', function() {
    const categoryName = prompt("Enter category name:");
    if (categoryName) 
    {
        createCategory(categoryName);

         //add catagories in firebase
        createCategoryInFirebase(UserId, categoryName);
    }
});

function createCategory(name) {
    const categoriesContainer = document.getElementById('categoriesContainer');
    const catButtonsContainer = document.getElementById('allCatagoryButtons');
    const content3 = document.getElementById('content3');
    const eachButtonsDiv = document.createElement('div');
    eachButtonsDiv.className = 'eachButtonsDiv';

    // Create category button
    const categoryBtn = document.createElement('button');
    categoryBtn.textContent = name;
    categoryBtn.className = 'catagButtons';
    categoryBtn.addEventListener('click', function() {
        // Hide all items containers
        document.querySelectorAll('.itemsContainer').forEach(container => {
            container.classList.add('hidden');
        });
        
        // Show only this category's items container
        const itemsContainer = document.getElementById(`itemsContainer_${name}`);
        if (itemsContainer) {
            itemsContainer.classList.remove('hidden');
        }

        document.querySelectorAll('.catagButtons.active').forEach(activeButton => {
            activeButton.classList.remove('active');
        });

        // Toggle the .active class on the clicked button
        this.classList.add('active');



    });
    eachButtonsDiv.appendChild(categoryBtn);

    // Create container for items
    const itemsContainer = document.createElement('div');
    itemsContainer.id = `itemsContainer_${name}`;
    itemsContainer.classList.add('hidden', 'itemsContainer');
    

    // Add button inside items container
    const addItemBtn = document.createElement('button');
    addItemBtn.textContent = "Add Item";
    addItemBtn.classList.add('addItemBtn');
    addItemBtn.style.display = 'none'; // Initially hidden unless in edit mode
    addItemBtn.addEventListener('click', function() {
        addItem(name, "New Item", true); // Prompt inside addItem handles naming
    });
    itemsContainer.appendChild(addItemBtn);

    // Add delete category button
    const deleteCategoryBtn = document.createElement('button');
    deleteCategoryBtn.textContent = "-";
    deleteCategoryBtn.classList.add('deleteCategoryBtn');
    deleteCategoryBtn.style.display = 'none'; // Initially hidden unless in edit mode
    deleteCategoryBtn.addEventListener('click', function() {
        // Confirm before deletion
        if (confirm(`Delete category "${name}" and all its items?`)) {
            catButtonsContainer.removeChild(eachButtonsDiv);
            categoriesContainer.removeChild(itemsContainer);
            // Optionally, remove category from Firebase
            console.log("inside click delete cat");
            removeCategoryFromFirebase(UserId, name);
        }
    });

   



    // Append elements
    // catButtonsContainer.insertBefore(deleteCategoryBtn, catButtonsContainer.firstChild); // Ensure delete is at the top or adjust as needed
    // catButtonsContainer.insertBefore(categoryBtn, catButtonsContainer.firstChild);
    eachButtonsDiv.appendChild(deleteCategoryBtn);
    categoriesContainer.appendChild(itemsContainer);
    catButtonsContainer.appendChild(eachButtonsDiv);
}

function removeCategoryFromFirebase(userId, categoryName) 
{
    console.log("inside func delete cat 1");
    const categoryRef = ref(db, `${userId}/workoutRoutine/${categoryName}`);
    remove(categoryRef, true);
    console.log("inside func delete cat 2");
}


function createCategoryInFirebase(userId, categoryName) 
{
    const dbRef = ref(db, `${userId}/workoutRoutine/${categoryName}`);
    set(dbRef, true); 
}







function addItem(categoryName, itemName, addToFirebase) {
    const itemsContainer = document.getElementById(`itemsContainer_${categoryName}`);
    if(addToFirebase==true)
    {
        itemName = prompt("Enter item name:");
    }
    // Limit to 15 items
    if (itemsContainer.querySelectorAll('.item').length < 12) 
    {
        const itemDiv = document.createElement('div');
        itemDiv.textContent = itemName;
        itemDiv.className = 'item';

        // Delete button for item
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '-';
        deleteBtn.classList.add('deleteItemBtn'); // Add class for easy selection
        deleteBtn.style.display = 'none'; // Initially hidden unless in edit mode
        deleteBtn.addEventListener('click', function() {
            // Remove item from Firebase
            removeItemFromFirebase(UserId, categoryName, itemName);
            itemsContainer.removeChild(itemDiv);
        });
        itemDiv.appendChild(deleteBtn); //

        itemsContainer.appendChild(itemDiv);
        
        // Add item to Firebase if needed
        if (addToFirebase && (itemName != null || itemName.trim() != "")) 
        {
            addItemToFirebase(UserId, categoryName, itemName);
        }
    } 
    else 
    {
        alert("Maximum of 12 items reached.");
    }
}

function addItemToFirebase(userId, categoryName, itemName) {
    const itemRef = ref(db, `${userId}/workoutRoutine/${categoryName}/items/${itemName}`);
    set(itemRef, true); // Or use an object with more details if necessary
}

function removeItemFromFirebase(userId, categoryName, itemName) {
    const itemRef = ref(db, `${userId}/workoutRoutine/${categoryName}/items/${itemName}`);
    remove(itemRef);
}


function fetchCategoriesAndItems(userId) {
    const categoriesRef = ref(db, `${userId}/workoutRoutine`);
    // let catagoryCount=0;

    get(categoriesRef).then((snapshot) => {
        if (snapshot.exists()) {
            
            const categories = snapshot.val();
            Object.keys(categories).forEach((categoryName) => {
                // Create category button and items container for each category
                createCategory(categoryName);
                // catagoryCount++;
               
                // Now fetch and display items for this category
                const items = categories[categoryName].items;
                if (items) {
                    Object.keys(items).forEach((itemName) => {
                        // Add each item to its category's container
                        addItem(categoryName, itemName, false); // Passing false to prevent adding to Firebase again
                    });
                }
            });
            // console.log(catagoryCount);
        }
    }).catch((error) => {
        console.error("Error fetching categories and items:", error);
    });
}







let isEditMode = false; // Tracks whether edit mode is active

document.getElementById('editModeToggle').addEventListener('click', function() {
    isEditMode = !isEditMode; // Toggle the edit mode state
    
    // Update button text based on the state
    this.textContent = isEditMode ? 'Done' : 'Edit';
    
    // Show or hide relevant buttons based on the edit mode state
    toggleEditButtons(isEditMode);
});

function toggleEditButtons(show) {
    // Toggle visibility of the "Add Category" button
    document.getElementById('addCategoryBtn').style.display = show ? 'flex' : 'none';
    
    // Query and toggle all "Add Item" and delete buttons within categories
    document.querySelectorAll('.addItemBtn, .deleteCategoryBtn, .deleteItemBtn').forEach(button => {
        button.style.display = show ? 'flex' : 'none';
    });
}












document.getElementById("calculateBtn").addEventListener("click", function() {
    // Inputs
    var age = parseInt(document.getElementById("age").value);
    var gender = document.querySelector('input[name="gender"]:checked').value;
    var feet = parseInt(document.getElementById("feet").value);
    var inches = parseInt(document.getElementById("inches").value);
    var pounds = parseInt(document.getElementById("pounds").value);
    var exercise = document.getElementById("exercise").value;

    // Convert height to cm and weight to kg
    var heightInCm = (feet * 30.48) + (inches * 2.54);
    var weightInKg = pounds * 0.453592;

    // Calculate BMR
    var bmr = gender === "male" ?
        (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) + 5 :
        (10 * weightInKg) + (6.25 * heightInCm) - (5 * age) - 161;

    // Assuming maintenance calories based on the active level and the given example
    var maintenanceCalories = 2526; // This value is an example; replace with a formula if needed

    // Calculate calorie intake for weight loss by applying percentage reductions
    var mildWeightLoss = maintenanceCalories * 0.9; // 90% for 0.5 lb/week
    var weightLoss = maintenanceCalories * 0.8; // 80% for 1 lb/week
    var extremeWeightLoss = maintenanceCalories * 0.6; // 60% for 2 lbs/week

    // Display results
    document.getElementById("bmrResult").textContent = "BMR: " + bmr.toFixed(2) + " calories/day";
    document.getElementById("maintenanceCalories").textContent = "Maintain weight: " + maintenanceCalories + " calories/day";
    document.getElementById("mildWeightLoss").textContent = "Mild weight loss (0.5 lb/week): " + mildWeightLoss.toFixed(2) + " calories/day";
    document.getElementById("weightLoss").textContent = "Weight loss (1 lb/week): " + weightLoss.toFixed(2) + " calories/day";
    document.getElementById("extremeWeightLoss").textContent = "Extreme weight loss (2 lbs/week): " + extremeWeightLoss.toFixed(2) + " calories/day";
});
