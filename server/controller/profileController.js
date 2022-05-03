/**
 * Agora - Close the loop
 * © 2021-2022 Brian Gormanly
 * BSD 3-Clause License
 * see included LICENSE or https://opensource.org/licenses/BSD-3-Clause 
 */

// dependencies


// services
const productService = require ( '../service/productService' );


exports.getProfile = async function( req, res ) {
    // get the user data
    let userId = req.params.userId;
    if( userId >= 0 ) {
        let user = await userService.getActiveUserById(userId);
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
        
        if(req.session.uploadMessage) {
            let message = req.session.uploadMessage;
            req.session.uploadMessage = null;
            res.render('./profile/manage', { authUser: authUser, user: authUser, products: products });
        }
        else {
            res.render('./profile/manage', { authUser: authUser, user: authUser, products: products });
        }
        
    }
    else {
        res.redirect(303, '/signIn');
    }
}