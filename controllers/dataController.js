const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const apiData = require("./../models/dataModel");

exports.getAllData = catchAsync(async (req, res, next) => {
  let filteredData = await apiData.find();

  if (req.query.headphoneType) {
    filteredData = filteredData.filter(
      (item) =>
        item.type.toLowerCase() === req.query.headphoneType.toLowerCase()
    );
  }

  if (req.query.company) {
    const companyFilter = req.query.company.toLowerCase();
    filteredData = filteredData.filter((item) => {
      const shortname = item.name.shortname.toLowerCase();
      const companyName = shortname.split(" ")[0];
      return companyName === companyFilter;
    });
  }

  if (req.query.color) {
    filteredData = filteredData.filter(
      (item) => item.color.toLowerCase() === req.query.color.toLowerCase()
    );
  }

  if (req.query.price) {
    const priceRange = parseInt(req.query.price);
    if (priceRange === 1) {
      filteredData = filteredData.filter(
        (item) => item.price >= 0 && item.price <= 1000
      );
    }  else if (priceRange === 2) {
      filteredData = filteredData.filter(
        (item) => item.price > 1000 && item.price <= 10000
      );
    } else if (priceRange === 3) {
      filteredData = filteredData.filter(
        (item) => item.price > 10000 && item.price <= 50000
      );
    }
  }

  const { search } = req.query;

  if (search) {
    const searchTerm = search.toLowerCase();
    filteredData = filteredData.filter((item) =>
      item.name.shortname.toLowerCase().startsWith(searchTerm)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      data: filteredData,
    },
  });
});

exports.getDataByIds = catchAsync(async (req, res, next) => {
  // Extract the IDs from the request query
  const { ids } = req.query;

  console.log(ids);

  if (!ids) {
    return next(new AppError("IDs not provided", 400));
  }

  // Split the IDs string into an array of integers
  const idArray = ids.split(",").map(Number);

  // Find the data items with IDs matching the ones provided
  const filteredData = await apiData.find({ id: { $in: idArray } });

  res.status(200).json({
    status: "success",
    data: {
      data: filteredData,
    },
  });
});
