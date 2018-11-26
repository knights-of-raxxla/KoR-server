const $errs = [
    `MutationReport:01:invalid success, must be a string`,
    `MutationReport:02:invalid event, must be a string`,
];
class MutationReport {
    constructor({success, event, context}) {
        if (!success && !typeof success === 'string')
            throw new Error($errs[0]);
        if (!event && !typeof event === 'string')
            throw new Error($errs[1]);

        return {sucess, event, context, __type: 'MutationReport'};
    }
}

module.exports = class MutationReportFactory {
    make({success, event, context}) {
        return new MutationReport({success, event, context});
    }
}
