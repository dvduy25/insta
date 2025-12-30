const jwt = require("jsonwebtoken");
const userModel = require("../user/userModel");

const middlewareController = {
    verifyToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.split(' ')[1]
            : null;
    
        if (!token) {
            return res.status(401).json("Chưa xác thực (No token provided)");
        }
    
        jwt.verify(token, process.env.key, (err, decoded) => {
            if (err) {
                return res.status(403).json("Token không hợp lệ hoặc đã hết hạn");
            }
            req.user = decoded; // lưu thông tin đã decode vào request để controller dùng tiếp
            next();
        });
    },

    verifyTokenAdmin: (req, res, next) => {
        middlewareController.verifyToken(req, res, () => {
            if (req.user.id == req.params.id || req.user.admin) {
                next();
            }
            else {
                res.status(403).json("ban k phai la ho")
            }
        })
    },
    


}
module.exports = middlewareController