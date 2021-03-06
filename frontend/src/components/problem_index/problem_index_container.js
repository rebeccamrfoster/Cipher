import { connect } from "react-redux";
import { fetchAllProblems } from "../../actions/problem_actions";
import { createUserGroupWithProblem } from "../../actions/group_actions"
import ProblemIndex from "./problem_index";

const mSTP = state => ({
        problems: Object.values(state.entities.problems.byId),
        currentUser: state.session.user
});

const mDTP = dispatch => ({
        fetchProblems: () => dispatch(fetchAllProblems()),
        createGroupWithProblem: (problemId) => (
            dispatch(createUserGroupWithProblem(problemId))
        )
});

export default connect(mSTP, mDTP)(ProblemIndex);