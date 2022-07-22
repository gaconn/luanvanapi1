class ResponseUtil{
    response = (isSuccess, message, data=[], arrError = []) =>{
        return {success: isSuccess, message: message, data, error: arrError}
    }

    makeTree = (parent, list) => {
        if(!parent || !parent.length === 0) {
            return null
        }

        if(!list || list.length === 0) {
            return null
        }
        for (let p = 0 ; p< parent.length ; p++) {
            if(parent[p].children_id) {
                var listChild = []
                for(let i= 0 ; i < list.length ; i++) {
                    if(list[i].id === parent[p].children_id[list[i].id]) {
                        listChild.push(list[i])
                        list.splice(i, 1)
                    }
                }
                var node = this.makeTree(listChild, list)
                parent[p].listChild = node
            }
            var node = this.makeTree(listChild, list)
            parent[p].listChild = node
        }
        return parent
    }
}

module.exports = new ResponseUtil()