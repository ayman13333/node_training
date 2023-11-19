class ErrorClass extends Error{
    constructor(message,status){
        super(message);
        this.name='ErrorClass';
        this.status=status;
    }
}

module.exports=ErrorClass;