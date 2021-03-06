/**
 * Agora - Close the loop
 * © 2021-2022 Brian Gormanly
 * BSD 3-Clause License
 * see included LICENSE or https://opensource.org/licenses/BSD-3-Clause 
 */

// dependencies


// services
const productService = require ( '../service/productService' );
const userService = require( '../service/userService' );

exports.getProfile = async function( req, res ) {
    // get the user data
    let userId = req.params.userId;
    let user = null;
    if( userId >= 0 ) {
        user = await userService.getActiveUserById(userId);
    }
    else {

    }

    //console.log("returned user: " + JSON.stringify(user));
    
    res.render('profile/user', {user: user});
}



exports.manageProfile = async function ( req, res ) {

    if(req.session.authUser) {
        
        const authUser = await userService.setUserSession(req.session.authUser.email);
        req.session.authUser = null;
        req.session.authUser = authUser;
        res.locals.authUser = req.session.authUser;
        // get user orders
        const orders = await productService.getOrdersByUserId(authUser.id);

        // get all products ordered
        let products = [];
        for(let i=0; i<orders.length; i++) {
            let product = await productService.getProductById(orders[i].productId);
            product.status = orders[i].orderStatus;
            products.push(product);
        }

        const messageType = req.session.messageType;
        const messageTitle = req.session.messageTitle;
        const messageBody = req.session.messageBody;

        if( req.session.messageType ) {
            delete req.session.messageType;
        }
        if( req.session.messageTitle ) {
            delete req.session.messageTitle;
        }
        if( req.session.messageBody ) {
            delete req.session.messageBody;
        }
        
        res.render('./profile/manage', { authUser: authUser, user: authUser, products: products, messageType: messageType, messageTitle: messageTitle, messageBody: messageBody });
        
        
    }
    else {
        res.redirect(303, '/signIn');
    }
}