module.exports = {
    localCode: DataTypes.STRING,
    oaciCode: DataTypes.STRING,
    iataCode: DataTypes.STRING,
    type: DataTypes.STRING,
    name: DataTypes.STRING,
    coordinates: DataTypes.STRING,
    elevation: DataTypes.STRING,
    elevationUnit: DataTypes.STRING,
    reference: DataTypes.STRING,
    distanceToReference: DataTypes.STRING,
    directionToReference: DataTypes.STRING,
    public: DataTypes.BOOLEAN,
    private: DataTypes.BOOLEAN,
    controlled: DataTypes.BOOLEAN,
    region: DataTypes.STRING,
    fir: DataTypes.STRING,
    use: DataTypes.STRING,
    traffic: DataTypes.STRING,
    province: DataTypes.STRING,
    isActive: DataTypes.BOOLEAN,    
};