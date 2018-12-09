
const sendAjaxForm = async (url, formName, cb) => {
    
    const body = $(document.forms[formName]).serializeJSON();
    fetch(url, {
        method: 'post',
        body,
        credentials: "include",
        headers: {
            'Content-Type': 'application/json'
        }
    }).then((res) => {
        if (!res.ok) throw res;
        return cb(null, res);
    })
    .catch(err => {
        err.text().then(errMsg => cb(errMsg, null))
    })
  
    
};