import mongoose from "mongoose"
import logging from "../log/logging.js";

const config = async () => {
    try {
        // good way. It'll log message if connected
        mongoose.connect('mongodb://127.0.0.1:27017/authentication', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
            .then(() => {
                logging.info('connected mongo database')
            })
            .catch((err) => {
                logging.debug('failed to connect cause is ' + err.toString())
                throw err
            });

    } catch (e) {

        logging.debug(e.toString())
        process.exit()

    }
}

/*await config()*/

export default config()
