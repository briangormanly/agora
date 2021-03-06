/**
 * Agora - Close the loop
 * © 2021-2022 Brian Gormanly
 * BSD 3-Clause License
 * see included LICENSE or https://opensource.org/licenses/BSD-3-Clause 
 */

// database connection
const db = require('../db/connection');

// import models
const User = require("../model/user");
const Goal = require("../model/goal");
const Topic = require("../model/topic");
const GoalEnrollment = require("../model/goalEnrollment");
const Event = require('../model/event');


/**
 * Retrieves all active goals with the highest version number
 * @returns All active goals as a list
 */
 exports.getAllActiveGoals = async function() {
    const text = "select * from goals gl INNER JOIN (SELECT id, MAX(goal_version) AS max_version FROM goals where active = $1 group by id) goalmax "
        + "on gl.id = goalmax.id AND gl.goal_version = goalmax.max_version order by gl.id;";
    const values = [ true ];

    let goals = [];
    
    try {
         
        let res = await db.query(text, values);
        

        for(let i=0; i<res.rows.length; i++) {
            goals.push(Goal.ormGoal(res.rows[i]));
        }

        return goals;
        
    }
    catch(e) {
        console.log(e.stack)
    }
    finally {
        
    }
}

/**
 * Retrieves all goals created by a particular owner with the highest version number
 * @param {Integer} ownerId - Id of the topic owner
 * @param {boolean} isActive - if true require that the topic is active to return, false returns all topics both active and in-active.
 * @returns All active goals as a list
 */
 exports.getAllGoalsForOwner = async function(ownerId, isActive) {

    let text = "";
    let values = [];
    if( !isActive ) {
        text = "select * from goals gl INNER JOIN (SELECT id, MAX(goal_version) AS max_version FROM goals group by id) goalmax "
        + "on gl.id = goalmax.id AND gl.goal_version = goalmax.max_version and gl.owned_by = $1 order by gl.id;";
        values = [ ownerId ];
    }
    else {
        // default to only retreiving active topics
        text = "select * from goals gl INNER JOIN (SELECT id, MAX(goal_version) AS max_version FROM goals where active = $1 group by id) goalmax "
        + "on gl.id = goalmax.id AND gl.goal_version = goalmax.max_version and gl.owned_by = $2 order by gl.id;";
        values = [ true, ownerId ];
    }

    let goals = [];
    
    try {
         
        let res = await db.query(text, values);
        

        for(let i=0; i<res.rows.length; i++) {
            goals.push(Goal.ormGoal(res.rows[i]));
        }

        return goals;
        
    }
    catch(e) {
        console.log(e.stack)
    }
    finally {
        
    }
}


/**
 * Returns all active goals including topics associated.
 * @returns List<goal> with topics
 */
exports.getAllActiveGoalsWithTopics = async function() {
    let text = "select * from goals gl INNER JOIN (SELECT id, MAX(goal_version) AS max_version FROM goals where active = $1 group by id) goalmax "
        + "on gl.id = goalmax.id AND gl.goal_version = goalmax.max_version order by gl.id;";
    let values = [ true ];

    let goals = [];
    
    try {
         
        let res = await db.query(text, values);
        for(let i=0; i<res.rows.length; i++) {
            text = "select * from goal_path where active = $1 and goal_rid = $2 order by position;";
            values = [ true, res.rows[i].rid ];
            let topics = [];
            let res2 = await db.query(text, values);

            for(let j=0; j<res2.rowCount; j++) {
                text = "select * from topics where active = $1 and id = $2;";
                values = [ true, res2.rows[j].topic_id];

                let res3 = await db.query(text, values);
                if(res3.rows[0]) {
                    topics.push(Topic.ormTopic(res3.rows[0]));
                }
                
            }
            let goal = Goal.ormGoal(res.rows[i]);
            goal.topics = topics;
            
            goals.push(goal);
        }

        
        return goals;
        
    }
    catch(e) {
        console.log(e.stack)
    }
}


/**
 * Get an active goal by id including associated topics
 * @param {Integer} goalId 
 * @param {boolean} isActive - if true require that the topic is active to return, false returns all topics both active and in-active.
 * @returns goal with topics
 */
exports.getActiveGoalWithTopicsById = async function( goalId, isActive ) {

    let text = "";
    let values = [];
    if( !isActive ) {
        text = "select * from goals gl INNER JOIN (SELECT id, MAX(goal_version) AS max_version FROM goals where id = $1 group by id) goalmax "
        + "on gl.id = goalmax.id AND gl.goal_version = goalmax.max_version order by gl.id;";
        values = [ goalId ];
    }
    else {
        // default to only retreiving active topics
        text = "select * from goals gl INNER JOIN (SELECT id, MAX(goal_version) AS max_version FROM goals where active = $1 AND id = $2 group by id) goalmax "
        + "on gl.id = goalmax.id AND gl.goal_version = goalmax.max_version order by gl.id;";
        values = [ true, goalId ];
    }


    try {
        let goal = null;
         
        let res = await db.query(text, values);
        if(res.rowCount > 0) {
            text = "select * from goal_path where active = $1 and goal_rid = $2 order by position;";
            values = [ true, res.rows[0].rid ];
            let topics = [];
            let res2 = await db.query(text, values);

            for(let j=0; j<res2.rowCount; j++) {
                text = "select * from topics where active = $1 and id = $2;";
                values = [ true, res2.rows[j].topic_id];

                let res3 = await db.query(text, values);
                if(res3.rowCount > 0) {
                    topics.push(Topic.ormTopic(res3.rows[0]));
                }
                
            }
            goal = Goal.ormGoal(res.rows[0]);
            goal.topics = topics;
               
        }

        return goal;
        
    }
    catch(e) {
        console.log(e.stack)
    }
}

/**
 * Get the most recent version of an goal by id
 * @param {Integer} goalId 
 * @returns goal
 */
 exports.getMostRecentGoalById = async function(goalId) {
    let text = "select * from goals gl INNER JOIN (SELECT id, MAX(goal_version) AS max_version FROM goals where id = $1 group by id) goalmax "
        + "on gl.id = goalmax.id AND gl.goal_version = goalmax.max_version order by gl.id;";
    let values = [ goalId ];
    try {
        let goal = "";
         
        let res = await db.query(text, values);
        if(res.rowCount > 0) {
            goal = Goal.ormGoal(res.rows[0]);
                  
        }
        return goal;
        
    }
    catch(e) {
        console.log(e.stack)
    }
}

/*
 * Update / set the user goal image
 * The previous filename that was overwritten (if any) is returned
 */
exports.updateGoalImage = async (goalId, filename) => {
    // get the goal (required to exist)
    let goal = await exports.getMostRecentGoalById(goalId);

    // save the current filename so that we can delete it after.
    let prevFileName = "";

    if(goal) {
        try {
            // retrieve the current filename so that we can delete it after.
            let text = "SELECT goal_image FROM goals WHERE rid = $1";
            let values = [goal.rid];

            // perform the query
            let res = await db.query(text, values);
            
            // set the prevFileName with the prev name
            if(res.rows.length > 0) {
                prevFileName = res.rows[0].goal_image;
            }

            // cerate the update query to set the new name
            text = "UPDATE goals SET goal_image = $2 WHERE rid = $1";
            values = [goal.rid, filename];

            // perform query
            await db.query(text, values);
            
        }
        catch(e) {
            console.log(e.stack);
        }

        return prevFileName;
    }
    else {
        // invalid db response!
        return false;
    }
};

/**
 * Saves a goal to the database, creates a new record if no id is assigned, updates existing record if there is an id.
 * @param {Goal} goal 
 * @returns Goal object with id 
 */
exports.saveGoal = async function(goal) {
    // check to see if an id exists - insert / update check
    //console.log( "about to save goal " + JSON.stringify( goal ) );
    if(goal) {
        if(goal.id > 0) {
            console.log("update");
            // update
            let text = "UPDATE goals SET goal_version = $1, goal_name = $2, goal_description = $3, active = $4, completable = $5, owned_by = $6, visibility = $7 WHERE id = $8 RETURNING rid;";
            let values = [ goal.goalVersion, goal.goalName, goal.goalDescription, goal.active, goal.completable, goal.ownedBy, goal.visibility, goal.id ];
    
            try {
                let res = await db.query(text, values);
                goal.rid = res.rows[0].rid;
            }
            catch(e) {
                console.log("[ERR]: Error updating goal - " + e);
                return false;
            }
            
        }
        else {
            // get the current max goal id
            console.log("insert");
            let text = "select max(id) from goals;";
            let values = [];
            try {
                let res = await db.query(text, values);
                goal.id = res.rows[0].max; 
                goal.id++;
                if(res.rowCount > 0) {
                    // insert
                    text = "INSERT INTO goals (id, goal_version, goal_name, goal_description, active, completable, owned_by, visibility) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, rid;";
                    values = [ goal.id, goal.goalVersion, goal.goalName, goal.goalDescription, goal.active, goal.completable, goal.ownedBy, goal.visibility ];
                    
                    let res2 = await db.query(text, values);
        
                    if(res2.rowCount > 0) {
                        goal.id = res2.rows[0].id;
                        goal.rid = res2.rows[0].rid;
                    }
                }
            }
            catch(e) {
                console.log("[ERR]: Error inserting goal - " + e);
                return false;
            }
        }
        return goal;
    }
    else {
        return false;
    }
}

/**
 * Will save or update pathway for goal.  Pathway represents the topics associated with a goal
 * and is passed as an Array of integers.  This function will replace any existing pathway for
 * the goal with the topics represented by the topic id's passed.
 * @param {Integer} goalId id of the goal for the pathway
 * @param {*} pathway Array of topic id's that make up the pathway
 * @returns true for success / false for failure
 */
exports.savePathwayToMostRecentGoalVersion = async function(goalId, pathway) {
    // get the most recent version of the goal
    let text = "SELECT rid, MAX(goal_version) as version from goals where id = $1 group by rid";
    let values = [ goalId ];

    try {
         
        let res = await db.query(text, values);
        
        if(res.rowCount > 0) {
            /**
             * TODO: the idea behind the goal version was to keep track of changes to the pathway and not 
             * just delete it and replace it.  This way if students finished a goal under with a particular 
             * pathway and completed but then the pathway changed after they would not be "incomplete" because
             * of the change.  This is will need to be explored, but for MVP I just want to work, as  it 
             * matures this should be re-evaluated.
             */
            // first remove current goal enrollments
            text = "DELETE FROM goal_path WHERE goal_rid=$1";
            let values = [ res.rows[0].rid ];

            let res2 = await db.query(text, values);

            // now loop through the array and add the new pathway
            /**
             * TODO: is_required needs to be passed in from the UI so we are just making everything required for now.  
             * This probably means having the pathway be an array of objects containing id and isRequired
             */
            if(pathway && pathway.length > 0) {
                for( let i=0; i < pathway.length; i++ ) {
                    text = "INSERT INTO goal_path (goal_rid, topic_id, position, is_required, active) VALUES ($1, $2, $3, $4, $5);";
                    values = [ res.rows[0].rid, pathway[i], (i + 1), true, true ];

                    let res3 = await db.query(text, values);
                }
            }
        }
    }
    catch(e) {
        console.log(e.stack);
        return false;
    }


    return true
}


/**
 * Add a user enrollment to the most recent version of a goal 
 * @param {Integer} userId id of user to enroll
 * @param {Integer} goalId id of goal
 * @returns true for successful operation or false if enrollment fails
 */
 exports.saveGoalEnrollmentMostRecentGoalVersion = async function(userId, goalId) {
    // get the most recent version of the goal
    let text = "SELECT rid, MAX(goal_version) as version from goals where id = $1 group by rid";
    let values = [ goalId ];

    try {
         
        let res = await db.query(text, values);
        
        if(res.rowCount > 0) {
            return exports.saveGoalEnrollment(userId, goalId, res.rows[0].version)
            
        }
    }
    catch(e) {
        console.log(e.stack);
        return false;
    }
}

/**
 * Add a user enrollment to the specified version of a goal 
 * @param {Integer} userId id of user to enroll
 * @param {Integer} goalId id of goal (Goal identifier is id + version)
 * @param {Integer} goalVersion version of goal
 * @returns true for successful operation or false if enrollment fails
 */
 exports.saveGoalEnrollment = async function(userId, goalRid, goalVersion) {
    // check this userId and goalRid combination does not already exist
    let text = "SELECT * FROM user_goal WHERE active = $1 AND user_id = $2 AND goal_rid = $3";
    let values = [ true, userId, goalRid ];

    try {
         
        let response = await db.query(text, values);

        if(!response.rowCount > 0) {       
            text = 'INSERT INTO user_goal(goal_rid, user_id, active, is_completed)'
                + 'VALUES($1, $2, $3, $4)';
            values = [ goalRid, userId, true, false ];

            let response = await db.query(text, values);
    
        }
        else {
            console.log("Duplicate user_goal not saved!!");
        }
        
        return true;
    }
    catch(e) {
        console.log(e.stack);
        return false;
    }
}

/**
 * Update the user goal enrollment and mark completed.
 * @param {Integer} userId 
 * @param {Integer} goalId 
 * @param {Integer} goalVersion 
 * @returns true if successful
 */
exports.completeGoalEnrollment = async function( userId, goalRid ) {
    let text = "UPDATE user_goal SET is_completed = $1, completed_date = NOW() WHERE active = $2 AND user_id = $3 AND goal_rid = $4;"
    let values = [ true, true, userId, goalRid ];

    try {
        let response = await db.query( text, values );
        return true;
    }
    catch(e) {
        console.log("[ERR]: Error updating goal enrollment - " + e);
        return false;
    }
}

/**
 * Gets a goal by goal id and version if the user id passed is currently enrolled in the goal.
 * @param {Integer} userId 
 * @param {Integer} goalId 
 * @param {Integer} goalVersion 
 * @returns goal if the user is actively enrolled
 */
exports.getEnrolledGoalByUserAndGoalRid = async function( userId, goalRid ) {
    console.log("params: userId " + userId + " goalRid: " + goalRid );
    let text = "SELECT ug.* FROM user_goal ug where ug.user_id = $1 AND ug.goal_rid = $2 and active = $3;" 
    let values = [ userId, goalRid , true ];
    
    let goal;
    try {
         
        let res = await db.query(text, values);
        if(res.rows.length > 0) {
            for(let i=0; i<res.rows.length; i++) {
                // get the goal for each user_goal
                text = "SELECT * FROM goals WHERE active = $1 AND rid = $2;"
                values = [ true, res.rows[i].goal_rid ];

                let res2 = await db.query(text, values);

                if(res2.rows.length > 0) {
                    goal = Goal.ormGoal(res2.rows[0]);
                }     
            }

        }
        else {
            return false;
        }
        return goal ;
    }
    catch(e) {
        console.log(e.stack)
    }
}

/**
 * Get all goals that a user has an active enrollment in either completed or incomplete
 * Returns the goal with the highest version number
 * if the user has more then one record for the same goal id.
 * @param {boolean} isCompleted whether or not the function should return completed enrollements
 * @param {Integer} userId id of user enrolled
 * @returns List<goal> a list of the goal objects the user is enrolled in
 *
 * @deprecated testing
 * This was replaced using getActiveEnrollmentsForUserId which returns the users enrollment in the goal path with an attached goal
 * this way the enrollment provides the completion data.
 * 
 exports.getActiveEnrolledGoalsForUserId = async function(userId, isCompleted) {
    let text = "SELECT ug.* FROM user_goal ug INNER JOIN " 
        + "(SELECT user_id, goal_id, MAX(goal_version) AS max_version FROM user_goal where user_id = $2 and active = $1 GROUP BY user_id, goal_id) groupedug " 
        + " ON ug.user_id = groupedug.user_id AND ug.goal_id = groupedug.goal_id AND ug.goal_version = groupedug.max_version and ug.is_completed = $3;";
    let values = [ true, userId , isCompleted ];
    
    let goals = [];
    try {
         
        let res = await db.query(text, values);
        if(res.rows.length > 0) {
            for(let i=0; i<res.rows.length; i++) {
                // get the goal for each user_goal
                text = "SELECT * FROM goals WHERE active = $1 AND id = $2 AND goal_version = $3;"
                values = [true, res.rows[i].goal_id, res.rows[i].goal_version ];

                let res2 = await db.query(text, values);

                if(res2.rows.length > 0) {
                    goals.push(Goal.ormGoal(res2.rows[0]));
                }     
            }

        }
        else {
            return false;
        }
        return goals;
    }
    catch(e) {
        console.log(e.stack)
    }
}
*/

/**
 * Get all enrollments (goal is accessable enrollment.goal) that a user is actively enrolled in
 * Returns the goal with the highest version number
 * if the user has more then one record for the same goal id.
 * @param {Integer} userId id of user enrolled
 * @returns List<goal> a list of the goal objects the user is enrolled in
 */
 exports.getActiveEnrollmentsForUserId = async function(userId) {

    let text = "select * from user_goal where user_id = $1 and active = $2;";
    let values = [ userId, true ];

    // this one was the last query used when goal_version was part of the goals key and part of the foriegn key of user_goal.

    // let text = "SELECT ug.* FROM user_goal ug INNER JOIN " 
    //     + "(SELECT user_id, goal_id, MAX(goal_version) AS max_version FROM user_goal where user_id = $2 and active = $1 GROUP BY user_id, goal_id) groupedug " 
    //     + " ON ug.user_id = groupedug.user_id AND ug.goal_id = groupedug.goal_id AND ug.goal_version = groupedug.max_version;";
    // ---- end last one used

    // get active enrollments, also check the the goal itself is active!
    // let text = "SELECT ug.*, g.active as g_active, g.id as g_id FROM user_goal ug "
    //     + "INNER JOIN (SELECT user_id, goal_id, MAX(goal_version) AS max_version FROM user_goal where user_id = $2 and active = $1 GROUP BY user_id, goal_id) "
    //     + "groupedug ON ug.user_id = groupedug.user_id AND ug.goal_id = groupedug.goal_id AND ug.goal_version = groupedug.max_version "
    //     + "INNER JOIN goals AS g ON ug.goal_id = g.id AND ug.goal_version = groupedug.max_version AND g.active = $1;"
    // note this is historical, upon testing I realized that implementing this code meant that completed goals were not showing up in users profiles and in feeds
    // so the approach taken was to have all active / inactive goals returned if the user has been enrolled and use goal.active to filter in the views where showing
    // the goal is not desirable 
    
    let enrollments = [];
    try {
         
        let res = await db.query(text, values);
        if(res.rows.length > 0) {
            for(let i=0; i<res.rows.length; i++) {
                let enrollment = GoalEnrollment.ormGoalEnrollment(res.rows[i]);

                // get the goal for each user_goal
                text = "SELECT * FROM goals WHERE rid = $1;"
                values = [ res.rows[i].goal_rid ];

                let res2 = await db.query(text, values);

                if(res2.rows.length > 0) {
                    enrollment.goal = Goal.ormGoal(res2.rows[0]);
                } 
                
                enrollments.push(enrollment);
            }

        }
        else {
            return false;
        }
        return enrollments;
    }
    catch(e) {
        console.log(e.stack)
    }
}


exports.getRecentGoalEnrollmentEvents = async function(limit) {
    limit = (!limit) ? 10 : limit;
    let text = "select ud.id as user_id, ud.username as username, ud.profile_filename as user_image, mod.rid as goal_id, mod.goal_name as goal_name, mod.goal_image as goal_image, mode.create_time as create_time from users ud, goals mod, user_goal mode where mode.user_id = ud.id AND mode.goal_rid = mod.rid and mode.active = true ORDER BY mode.create_time desc LIMIT $1;";
    let values = [ limit ];
    
    try {
        
        let res = await db.query(text, values);
        
        let enrollmentEvents = [];
        if(res.rows.length > 0) {
            for(let i=0; i<res.rows.length; i++) {
                let event = Event.emptyEvent();
                event.eventUserId = res.rows[i].user_id;
                event.eventItemId = res.rows[i].goal_rid;
                event.eventItem = "Goal Enrollment";
                event.eventType = "Goal Enrollment";
                event.eventUsername = res.rows[i].username;
                event.eventTime = res.rows[i].create_time;
                event.eventTitle = "<a href='/user/" + res.rows[i].user_id + "'>" + res.rows[i].username + "</a> <span style='color:darkblue'>Enrolled in <img src='" + process.env.GOAL_IMAGE_WEB_PATH + res.rows[i].goal_image + "' alt='Goal Badge' title='Goal Badge' class='profile-top-image' /> </span><a href='/community/goal/" + res.rows[i].goal_id + "'>" + res.rows[i].goal_name + "</a>";
                event.eventImage = res.rows[i].user_image;
                event.eventImage2 = res.rows[i].goal_image;
                enrollmentEvents.push(event);
            }
        }
        else {
            return false;
        }
        return enrollmentEvents;
    }
    catch(e) {
        console.log(e.stack);
        return false;
    }  
}

exports.getRecentGoalCompletionEvents = async function(limit) {
    limit = (!limit) ? 10 : limit;
    let text = "select ud.id as user_id, ud.username as username, ud.profile_filename as user_image, mod.rid as goal_rid, mod.goal_name as goal_name, mod.goal_image as goal_image, mode.completed_date as completed_date from users ud, goals mod, user_goal mode where mode.user_id = ud.id AND mode.goal_rid = mod.rid and mode.active = true AND mode.is_completed = true ORDER BY mode.completed_date desc LIMIT $1;";
    let values = [ limit ];
    
    try {
        
        let res = await db.query(text, values);
        
        let enrollmentEvents = [];
        if(res.rows.length > 0) {
            for(let i=0; i<res.rows.length; i++) {
                let event = Event.emptyEvent();
                event.eventUserId = res.rows[i].user_id;
                event.eventItemId = res.rows[i].goal_rid;
                event.eventItem = "Goal Completion!";
                event.eventType = "Goal Completion!";
                event.eventUsername = res.rows[i].username;
                event.eventTime = res.rows[i].completed_date;
                event.eventTitle = "<a href='/user/" + res.rows[i].user_id + "'>" + res.rows[i].username + "</a><span style='color:darkgreen'><strong> completed </strong></span> <img src='" + process.env.GOAL_IMAGE_WEB_PATH + res.rows[i].goal_image + "' alt='Goal Badge' title='Goal Badge' class='profile-top-image' /> <a href='/community/goal/" + res.rows[i].goal_id + "'>" + res.rows[i].goal_name + "</a>";
                event.eventImage = res.rows[i].user_image;
                event.eventImage2 = res.rows[i].goal_image;
                enrollmentEvents.push(event);
            }
        }
        else {
            return false;
        }
        return enrollmentEvents;
    }
    catch(e) {
        console.log(e.stack);
        return false;
    }  
}