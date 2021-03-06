/**
 * This file is a massive TODO 
 * This was all the logic originally in Coding Coach's goalRoutes.js
 * It handled all of the routing and controller code (was not broken out)
 * for the goal lesson process.  Now goals are stand alone and make just 
 * represent an organizational structure. The "enrollment" process will
 * have to be re-thoughtout as part of the merger with Agora, at which
 * time I should revisit this code.
 * 
 * One of the first questions should be to determine if this is actually an
 * API router / controller or a page router / controller or some combination
 * thereof. I think this will be more clear once the actual goal, toic and
 * resource API routes and controllers are built out.
 */

/**
 * Agora - Close the loop
 * © 2021-2022 Brian Gormanly
 * BSD 3-Clause License
 * see included LICENSE or https://opensource.org/licenses/BSD-3-Clause 
 */

var express = require('express');
var router = express.Router();


// require services
const goalService = require('../../service/goalService');
const userService = require('../../service/userService');

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({
    extended: true
  }));
router.use(bodyParser.json());


// check that the user is logged in!
router.use(function (req, res, next) {
    if(!req.session.authUser) {
        if(req.query.redirect) {
            res.locals.redirect = req.query.redirect;
        }
        res.render('user-signup');
    }
    else {
        next();
    }
});

/**
 * Route called from the mark goal complete form
 */
router.route( '/' )
    .post( async ( req, res ) => {
        let goalId = req.body.goalId;
        let goalRid = await goalService.getMostRecentGoalById( goalId );

        let goalVersion = req.body.goalVersion;

        if( req.session && req.session.authUser && goalRid && goalVersion ) {
            // verify that the user is enrolled in the goal and that the goals topics are complete
            let userGoal = await goalService.getEnrolledGoalByUserAndGoalRid( req.session.authUser.id, goalRid.rid );

            if(userGoal) {
                await goalService.completeGoalEnrollment( req.session.authUser.id, goalRid.rid );

                // reset the session
                const rUser = await userService.setUserSession( req.session.authUser.email );

                req.session.authUser = null;
                req.session.authUser = rUser;
            }
        }
        // send them to the course
        res.redirect( '/community/goal/' + goalId );
        if( req.session.messageTitle ) delete req.session.messageTitle;
        if( req.session.messageBody ) delete req.session.messageBody;
        req.session.save();
    }
);

router.route('/:goalId')
    .get(async (req, res) => {
        
        // get the topic data
        let goalId = req.params.goalId;
        let goal = await goalService.getActiveGoalWithTopicsById( goalId, true );
        //console.log("goal: " + JSON.stringify(goal));
        
        res.render( 'community/goal', { user: req.session.authUser, goal: goal, message:req.session.messageTitle, message2:req.session.messageBody } );
        if( req.session.messageTitle ) delete req.session.messageTitle;
        if( req.session.messageBody ) delete req.session.messageBody;
        req.session.save();
    }
);


router.route( '/enroll/:goalId' )
    .get( async ( req, res ) => {
        let goalId = req.params.goalId;
        if( req.session.authUser ) {

            // save the enrollment for the user in the goal
            await goalService.saveGoalEnrollmentMostRecentGoalVersion( req.session.authUser.id, goalId );

            // reset the session
            const rUser = await userService.setUserSession( req.session.authUser.email );

            req.session.authUser = null;
            req.session.authUser = rUser;

            // send them to the course
            res.redirect('/community/goal/' + goalId);
            
        }
        else {
            res.render('user-signup');
        }
    }
);



module.exports = router;
