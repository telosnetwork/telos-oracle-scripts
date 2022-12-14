const { createInitialTypes, SerialBuffer } = require('eosjs/dist/eosjs-serialize');

function nameToInt(name){
    const builtinTypes = createInitialTypes()
    const typeUint64 = builtinTypes.get("uint64")
    const typeName = builtinTypes.get("name")
    var buffer = new SerialBuffer({ textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

    typeName.serialize(buffer, name)
    return parseInt(typeUint64.deserialize(buffer))
}
module.exports = nameToInt;