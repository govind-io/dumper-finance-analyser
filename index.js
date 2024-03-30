function generateTable(e, append = false) {
  e.preventDefault();

  const inputElem = document.getElementById("inputData");
  // Get the input from the text area
  const input = inputElem.value;

  // Split the input into lines
  const lines = input.trim().split("\n");

  // Get the table element
  const table = document.getElementById("data-table");

  if (!append) {
    // Clear existing table rows except for the header
    table.innerHTML = table.rows[0].outerHTML;
  }

  // Iterate over each line, skipping the header
  lines.slice(1).forEach((line) => {
    const rowData = line.split("\t");
    const row = table.insertRow(-1);

    rowData.forEach((data) => {
      const cell = row.insertCell(-1);
      cell.textContent = data;
    });
  });

  inputElem.value = "";
}

function tableToJson(id = "data-table") {
  // Get the table element
  const table = document.getElementById(id);
  const headers = [];
  const data = [];

  // Get the headers from the first row of the table
  const headerCells = table.rows[0].cells;
  for (let i = 0; i < headerCells.length; i++) {
    headers[i] = headerCells[i].textContent.trim();
  }

  // Iterate over the rows of the table to get the data
  for (let i = 1; i < table.rows.length; i++) {
    const tableRow = table.rows[i];
    const rowData = {};

    // Iterate over each cell in the row
    for (let j = 0; j < tableRow.cells.length; j++) {
      rowData[headers[j]] = tableRow.cells[j].textContent.trim();
    }

    // Add the row's data object to the data array
    data.push(rowData);
  }

  // Convert the data array to a JSON string
  return data;
}

function analyzeAndCreateTable(data) {
  const summary = data.reduce((acc, entry) => {
    const {
      Company,
      Total,
      "Payment status": PaymentStatus,
      "Fuel refilled status": FuelRefilledStatus,
      "Fuel total": FuelTotal,
      "Driver bonus per tip": DriverBonusPerTip,
      "Driver bonus total": DriverBonusTotal,
      "Driver bonus payment status": DriverBonusPaymentStatus,
      Date,
    } = entry;

    if (!acc[Company]) {
      acc[Company] = {
        TotalPaid: 0,
        TotalUnpaid: 0,
        Total: 0,
        TotalRefilledFuel: 0,
        TotalPendingFuel: 0,
        TotalDriverBonusPaid: 0,
        TotalDriverBonusUnpaid: 0,
        UnpaidDates: [],
        PaidDates: [],
        RefilledDates: [],
        NotRefilledDates: [],
        DriverBonusPaidDates: [],
        DriverBonusNotPaidDates: [],
      };
    }

    const companySummary = acc[Company];
    companySummary.Total += Number(Total);
    if (PaymentStatus === "Paid") {
      companySummary.TotalPaid += Number(Total);
      companySummary.PaidDates.push(Date);
    } else {
      companySummary.TotalUnpaid += Number(Total);
      companySummary.UnpaidDates.push(Date);
    }

    if (FuelRefilledStatus === "Y") {
      companySummary.TotalRefilledFuel += Number(FuelTotal);
      companySummary.RefilledDates.push(Date);
    } else {
      companySummary.TotalPendingFuel += Number(FuelTotal);
      companySummary.NotRefilledDates.push(Date);
    }

    if (DriverBonusPaymentStatus === "Y") {
      companySummary.TotalDriverBonusPaid += Number(DriverBonusTotal);
      companySummary.DriverBonusPaidDates.push(Date);
    } else {
      companySummary.TotalDriverBonusUnpaid += Number(DriverBonusTotal);
      companySummary.DriverBonusNotPaidDates.push(Date);
    }

    return acc;
  }, {});

  const table = document.getElementById("analysed-table");

  table.innerHTML = table.rows[0].outerHTML;

  const finalRowData = {
    TotalPaid: 0,
    TotalUnpaid: 0,
    TotalRefilledFuel: 0,
    TotalPendingFuel: 0,
    TotalDriverBonusPaid: 0,
    TotalDriverBonusUnpaid: 0,
    Total: 0,
  };

  // Create a table and append it to the body
  Object.keys(summary).forEach((company) => {
    const companySummary = summary[company];
    const row = table.insertRow(-1);
    row.innerHTML = `
            <td>${company}</td>
            <td>${companySummary.TotalPaid}</td>
            <td>${companySummary.TotalUnpaid}</td>
            <td>${companySummary.Total}</td>
            <td>${companySummary.TotalRefilledFuel}</td>
            <td>${companySummary.TotalPendingFuel}</td>
            <td>${companySummary.TotalDriverBonusPaid}</td>
            <td>${companySummary.TotalDriverBonusUnpaid}</td>
        `;
    finalRowData.TotalPaid += companySummary.TotalPaid;
    finalRowData.TotalUnpaid += companySummary.TotalUnpaid;
    finalRowData.TotalRefilledFuel += companySummary.TotalRefilledFuel;
    finalRowData.TotalPendingFuel += companySummary.TotalPendingFuel;
    finalRowData.TotalDriverBonusPaid += companySummary.TotalDriverBonusPaid;
    finalRowData.TotalDriverBonusUnpaid +=
      companySummary.TotalDriverBonusUnpaid;

    finalRowData.Total += companySummary.Total;
  });

  const finalRow = table.insertRow(-1);
  finalRow.innerHTML = `
            <td>Final Total</td>
            <td>${finalRowData.TotalPaid}</td>
            <td>${finalRowData.TotalUnpaid}</td>
            <td>${finalRowData.Total}</td>
            <td>${finalRowData.TotalRefilledFuel}</td>
            <td>${finalRowData.TotalPendingFuel}</td>
            <td>${finalRowData.TotalDriverBonusPaid}</td>
            <td>${finalRowData.TotalDriverBonusUnpaid}</td>
        `;
}

function analyseTable(e) {
  e.preventDefault();

  const data = tableToJson();

  const startDate = new Date(e.target.startDate.value);
  const endDate = new Date(e.target.endDate.value);

  const filteredData = data.filter((entry) => {
    const [day, month, year] = entry.Date.split("-");
    const date = new Date(`${year}-${month}-${day}`);

    const isValid = date >= startDate && date <= endDate;

    return isValid;
  });

  analyzeAndCreateTable(filteredData);
}

function setDefaultDateRange() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const firstDateOfYear = new Date(currentYear, 0, 1)
    .toISOString()
    .slice(0, 10);
  const lastDateOfYear = new Date(currentYear, 11, 31)
    .toISOString()
    .slice(0, 10);

  document.getElementById("startDate").value = firstDateOfYear;
  document.getElementById("endDate").value = lastDateOfYear;
}

setDefaultDateRange();
