
const phoneRegexp = /\+\d{11}/

exports.addressIsValid = (conc, address) => {
    if (!address) {
        return false
    } 

    switch (conc) {
        case 'btc':
            if (address.length < 24) {
                return false;
            }
            break;
        case 'qiwi':
            if (isNaN(address) || address.length !== 12 || (address.search(phoneRegexp) === -1) ) {
                return false;
            }

            break;
        default:
            return false;
    }

    return true;
}